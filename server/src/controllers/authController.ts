
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

import { User } from "../models/User.js";

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { name, email, password } = req.body ?? {};

    // Validate required fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
      return;
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate name
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      normalizedEmail.length > 254 ||
      !emailRegex.test(normalizedEmail)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
      return;
    }

    // Validate password
    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes.",
      });
      return;
    }

    // Check JWT configuration
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: "Authentication is not configured on the server.",
      });
      return;
    }

    // Check whether the email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    // Hash the password before saving
    const passwordHash = await bcrypt.hash(password, 12);

    // Create the user
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    });

    // Generate authentication token
    const expiresIn = (process.env.JWT_EXPIRES_IN ||
      "7d") as SignOptions["expiresIn"];

    const token = jwt.sign(
      { sub: user._id.toString() },
      jwtSecret,
      { expiresIn }
    );

    // Return user details without the password hash
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    // Handle duplicate email errors, including database index conflicts
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create your account. Please try again.",
    });
  }
}
