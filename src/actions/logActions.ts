"use server";
import db from '@/lib/db';

export interface ErrorLog {
  id: number;
  message: string;
  stack: string | null;
  created_at: string;
}

export async function logError(message: string, stack?: string) {
  try {
    const stmt = db.prepare('INSERT INTO error_logs (message, stack) VALUES (?, ?)');
    stmt.run(message, stack || null);
  } catch (e) {
    console.error("Failed to write to error log:", e);
  }
}

export async function getErrorLogs(): Promise<ErrorLog[]> {
  try {
    const stmt = db.prepare('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 100');
    return stmt.all() as ErrorLog[];
  } catch (e) {
    console.error("Failed to read error log:", e);
    return [];
  }
}

export async function clearErrorLogs() {
  try {
    db.prepare('DELETE FROM error_logs').run();
  } catch (e) {
    console.error("Failed to clear error log:", e);
  }
}
