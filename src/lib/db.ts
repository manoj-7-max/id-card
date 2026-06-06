import Database from 'better-sqlite3';
import path from 'path';

// Construct the absolute path to the database file
const dbPath = path.join(process.cwd(), 'templates.sqlite');

// Initialize the database connection
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create the templates table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    json_data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    stack TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
