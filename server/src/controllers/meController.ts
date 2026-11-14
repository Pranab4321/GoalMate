
import type { Request, Response } from "express";

import { User } from "../models/User.js";

export async function getCurrentUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get the authenticated user's ID from JWT middleware
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    // Find the user in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User account not found.",
      });
      return;
    }

    // Return public user information
    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve user profile.",
    });
  }
}
