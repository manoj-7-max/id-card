"use server";

import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export interface TemplateRecord {
  id: string;
  name: string;
  json_data: string;
  updated_at: string;
}

export async function getTemplates(): Promise<TemplateRecord[]> {
  const stmt = db.prepare('SELECT * FROM templates ORDER BY updated_at DESC');
  return stmt.all() as TemplateRecord[];
}

export async function createTemplate(name: string, jsonData: string): Promise<TemplateRecord> {
  const id = uuidv4();
  const stmt = db.prepare('INSERT INTO templates (id, name, json_data) VALUES (?, ?, ?)');
  stmt.run(id, name, jsonData);
  
  const getStmt = db.prepare('SELECT * FROM templates WHERE id = ?');
  const record = getStmt.get(id) as TemplateRecord;
  
  revalidatePath('/'); // Invalidate cache so UI updates
  return record;
}

export async function updateTemplate(id: string, name: string, jsonData: string): Promise<TemplateRecord> {
  const stmt = db.prepare('UPDATE templates SET name = ?, json_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(name, jsonData, id);
  
  const getStmt = db.prepare('SELECT * FROM templates WHERE id = ?');
  const record = getStmt.get(id) as TemplateRecord;
  
  revalidatePath('/');
  return record;
}

export async function deleteTemplate(id: string): Promise<void> {
  const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
  stmt.run(id);
  revalidatePath('/');
}
