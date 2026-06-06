import type { ColumnMapping, StudentRecord } from '../types';

export function readField(record: StudentRecord, mapping: ColumnMapping, field: string): string {
  const mapped = mapping[field];
  return String(record[mapped || field] ?? '');
}

export function resolvePlaceholders(text: string, record: StudentRecord, mapping: ColumnMapping): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) => {
    const cleanKey = key.trim();
    return readField(record, mapping, cleanKey);
  });
}

export function safeFileName(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return cleaned || fallback;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
