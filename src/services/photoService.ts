import type { ColumnMapping, StudentRecord } from '../types';
import { readField } from '../utils/fields';

export interface PhotoSummary {
  matched: Map<string, string>;
  missing: string[];
  supportedFiles: string[];
}

const PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png']);

function key(value: string) {
  return value.trim().toLowerCase();
}

export function isSupportedPhoto(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return PHOTO_EXTENSIONS.has(ext);
}

export function matchPhotos(
  records: StudentRecord[],
  mapping: ColumnMapping,
  files: File[]
): PhotoSummary {
  const lookup = new Map<string, string>();
  const supportedFiles: string[] = [];

  for (const file of files) {
    if (!isSupportedPhoto(file.name)) continue;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const url = URL.createObjectURL(file);
    lookup.set(key(baseName), url);
    supportedFiles.push(file.name);
  }

  const matched = new Map<string, string>();
  const missing: string[] = [];

  records.forEach((record, index) => {
    const studentId = readField(record, mapping, 'StudentID');
    const admissionNo = readField(record, mapping, 'AdmissionNo');
    const recordKey = studentId || admissionNo || String(index + 1);
    const photo = lookup.get(key(studentId)) || lookup.get(key(admissionNo));

    if (photo) matched.set(recordKey, photo);
    else missing.push(recordKey);
  });

  return { matched, missing, supportedFiles };
}

export function getRecordPhotoPath(
  record: StudentRecord,
  index: number,
  mapping: ColumnMapping,
  matched: Map<string, string>
) {
  const studentId = readField(record, mapping, 'StudentID');
  const admissionNo = readField(record, mapping, 'AdmissionNo');
  return matched.get(studentId) || matched.get(admissionNo) || matched.get(String(index + 1)) || '';
}
