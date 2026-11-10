
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "goalmate.db";

let database: SQLite.SQLiteDatabase | null = null;
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns the existing database connection.
 * Opens a new connection only when necessary.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) {
    return database;
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // Enable foreign key relationships.
      await db.execAsync("PRAGMA foreign_keys = ON;");

      // Improve database read/write performance.
      await db.execAsync("PRAGMA journal_mode = WAL;");

      database = db;

      return db;
    } catch (error) {
      databasePromise = null;
      throw error;
    }
  })();

  return databasePromise;
}

/**
 * Closes the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.closeAsync();
    database = null;
    databasePromise = null;
  }
}
