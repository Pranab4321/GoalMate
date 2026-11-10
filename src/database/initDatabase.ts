
import type { SQLiteDatabase } from "expo-sqlite";
import { getDatabase } from "./database";
import { createTables } from "./schema";

let initializationPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Initializes the GoalMate database.
 * Creates tables and inserts default user settings.
 */
export async function initializeDatabase(): Promise<SQLiteDatabase> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const db = await getDatabase();

      // Create all database tables and indexes.
      await createTables(db);

      // Insert default settings only if they don't already exist.
      await db.runAsync(
        `INSERT OR IGNORE INTO user_settings (id) VALUES (1);`
      );

      return db;
    } catch (error) {
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}
