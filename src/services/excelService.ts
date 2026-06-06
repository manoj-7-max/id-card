/**
 * @module excelService
 * @description Excel and CSV file parsing service using the SheetJS (xlsx) library.
 *
 * Provides functions to:
 * - Parse Excel files (.xlsx, .xls) from an ArrayBuffer
 * - Parse CSV text
 * - Auto-detect column-to-field mappings based on name similarity
 *
 * All parsed data is returned as an array of {@link StudentRecord} objects
 * (plain key-value maps) keyed by the column headers from the first row.
 */

import * as XLSX from 'xlsx';
import type { StudentRecord, ColumnMapping, StandardField } from '../types';
import { STANDARD_FIELDS } from '../types';

/* ─── Result type returned by parsers ─────────────────── */

/** The result of parsing an Excel or CSV source */
export interface ParseResult {
  /** Column header names extracted from the first row */
  columns: string[];
  /** Array of data records (one per row, keyed by column name) */
  records: StudentRecord[];
}

/* ─── Similarity helpers (private) ────────────────────── */

/**
 * Normalise a string for fuzzy comparison.
 * Lowercases, strips non-alphanumeric characters and collapses whitespace.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Mapping of normalised aliases → standard field names.
 * Multiple aliases can point to the same standard field so that
 * columns like "roll_no", "student id", "enrolment" all resolve
 * correctly.
 */
const ALIAS_MAP: Record<string, StandardField> = {
  // StudentID
  studentid: 'StudentID',
  rollno: 'StudentID',
  rollnumber: 'StudentID',
  enrolmentno: 'StudentID',
  enrollmentno: 'StudentID',
  id: 'StudentID',
  // AdmissionNo
  admissionno: 'AdmissionNo',
  admissionnumber: 'AdmissionNo',
  admno: 'AdmissionNo',
  regno: 'AdmissionNo',
  registrationno: 'AdmissionNo',
  // Name
  name: 'Name',
  fullname: 'Name',
  studentname: 'Name',
  pupilname: 'Name',
  employeename: 'Name',
  // Class
  class: 'Class',
  grade: 'Class',
  standard: 'Class',
  std: 'Class',
  year: 'Class',
  // Section
  section: 'Section',
  division: 'Section',
  div: 'Section',
  // Department
  department: 'Department',
  dept: 'Department',
  branch: 'Department',
  // BloodGroup
  bloodgroup: 'BloodGroup',
  blood: 'BloodGroup',
  bg: 'BloodGroup',
  // DOB
  dob: 'DOB',
  dateofbirth: 'DOB',
  birthdate: 'DOB',
  birthday: 'DOB',
  // Phone
  phone: 'Phone',
  mobile: 'Phone',
  mobileno: 'Phone',
  phoneno: 'Phone',
  phonenumber: 'Phone',
  contact: 'Phone',
  contactno: 'Phone',
  // Address
  address: 'Address',
  addr: 'Address',
  residentialaddress: 'Address',
};

/* ─── Public API ──────────────────────────────────────── */

/**
 * Parse an Excel file from a raw ArrayBuffer.
 *
 * The first row is treated as column headers.  Subsequent rows are
 * converted into {@link StudentRecord} objects keyed by the header
 * text.  Empty rows are skipped.
 *
 * @param buffer - The raw bytes of an `.xlsx` or `.xls` file.
 * @returns Parsed column names and student records.
 *
 * @example
 * ```ts
 * const buf = await file.arrayBuffer();
 * const { columns, records } = parseExcelFile(buf);
 * ```
 */
export function parseExcelFile(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Always use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { columns: [], records: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { columns: [], records: [] };
  }

  // Convert to array of objects – SheetJS uses the first row as headers
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false, // convert everything to strings
  });

  if (rawRows.length === 0) {
    return { columns: [], records: [] };
  }

  // Extract column names from the keys of the first row
  const columns = Object.keys(rawRows[0]);

  // Map each raw row to a StudentRecord (string values only)
  const records: StudentRecord[] = rawRows.map((row) => {
    const record: StudentRecord = {};
    for (const col of columns) {
      record[col] = String(row[col] ?? '');
    }
    return record;
  });

  return { columns, records };
}

/**
 * Parse CSV text content into column names and records.
 *
 * Uses SheetJS internally so the CSV dialect handling (quoted fields,
 * multi-line values, etc.) is consistent with the Excel parser.
 *
 * @param text - Raw CSV text (including header row).
 * @returns Parsed column names and student records.
 *
 * @example
 * ```ts
 * const csvText = await file.text();
 * const { columns, records } = parseCsvFile(csvText);
 * ```
 */
export function parseCsvFile(text: string): ParseResult {
  const workbook = XLSX.read(text, { type: 'string' });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { columns: [], records: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { columns: [], records: [] };
  }

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  });

  if (rawRows.length === 0) {
    return { columns: [], records: [] };
  }

  const columns = Object.keys(rawRows[0]);

  const records: StudentRecord[] = rawRows.map((row) => {
    const record: StudentRecord = {};
    for (const col of columns) {
      record[col] = String(row[col] ?? '');
    }
    return record;
  });

  return { columns, records };
}

/**
 * Attempt to automatically map Excel/CSV column names to the
 * application's standard placeholder fields.
 *
 * Uses a built-in alias table so that variations like "Roll No",
 * "student_id", "Full Name", etc. are resolved to the correct
 * standard field.  Unrecognised columns are left unmapped.
 *
 * @param columns - Array of column header strings from the parsed file.
 * @returns A {@link ColumnMapping} mapping standard placeholders to
 *          the matching column name, for every column that could be
 *          matched.
 *
 * @example
 * ```ts
 * const mapping = autoDetectColumnMapping(['Roll No', 'Student Name', 'Grade']);
 * // => { StudentID: 'Roll No', Name: 'Student Name', Class: 'Grade' }
 * ```
 */
export function autoDetectColumnMapping(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  // Track which standard fields have already been claimed so we don't
  // map two columns to the same placeholder.
  const claimedFields = new Set<string>();

  for (const col of columns) {
    const normCol = normalise(col);

    // 1. Try exact match against the standard field name (normalised)
    const exactMatch = (STANDARD_FIELDS as readonly string[]).find(
      (sf) => normalise(sf) === normCol
    );

    if (exactMatch && !claimedFields.has(exactMatch)) {
      mapping[exactMatch] = col;
      claimedFields.add(exactMatch);
      continue;
    }

    // 2. Try alias table lookup
    const aliasMatch = ALIAS_MAP[normCol];
    if (aliasMatch && !claimedFields.has(aliasMatch)) {
      mapping[aliasMatch] = col;
      claimedFields.add(aliasMatch);
    }
  }

  return mapping;
}
