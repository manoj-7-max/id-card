/* ─── Core Type Definitions for ID Card Generator Pro ─── */

/** A single record from the Excel/CSV file */
export interface StudentRecord {
  [key: string]: string;
}

/** Mapping from template placeholder to Excel column name */
export interface ColumnMapping {
  [placeholder: string]: string;
}

/** Standard placeholders the app supports */
export const STANDARD_FIELDS = [
  'StudentID',
  'AdmissionNo',
  'Name',
  'Class',
  'Section',
  'Department',
  'BloodGroup',
  'DOB',
  'Phone',
  'Address',
] as const;

export type StandardField = (typeof STANDARD_FIELDS)[number];

/** Photo matching result */
export interface PhotoMatch {
  recordIndex: number;
  studentId: string;
  photoPath: string;
  matched: boolean;
}

/** ─── Template Types ─── */

export type CanvasElementType =
  | 'text'
  | 'image'
  | 'photo'
  | 'logo'
  | 'qrcode'
  | 'barcode'
  | 'shape'
  | 'line'
  | 'background';

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  name: string;

  // Text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  padding?: number;

  // Image/Logo/Photo properties
  src?: string;
  imageFit?: 'fill' | 'contain' | 'cover';
  frameShape?: 'rect' | 'circle';
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;

  // Effects (Shadow)
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  // Shape properties
  shapeType?: 'rect' | 'circle' | 'ellipse' | 'triangle' | 'star';
  backgroundColor?: string;
  stroke?: string;
  strokeWidth?: number;
  dash?: number[];

  // QR/Barcode properties
  dataField?: string;
  qrDataType?: 'id' | 'json' | 'custom';
  qrCustomData?: string;
  barcodeFormat?: string;

  // Line properties
  points?: number[];
}

export type CardSide = 'front' | 'back';

export interface CardSizePreset {
  name: string;
  label: string;
  width: number;
  height: number;
}

export const CARD_SIZE_PRESETS: CardSizePreset[] = [
  { name: 'cr80', label: 'CR80 (3.375" × 2.125")', width: 1013, height: 638 },
  { name: 'portrait', label: 'Portrait (2.5" × 3.5")', width: 750, height: 1050 },
  { name: 'landscape', label: 'Landscape (3.5" × 2.5")', width: 1050, height: 750 },
  { name: 'a4-portrait', label: 'A4 Portrait', width: 2480, height: 3508 },
  { name: 'custom', label: 'Custom Size', width: 1000, height: 600 },
];

export interface Template {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  backgroundImage?: string;
  frontElements: CanvasElement[];
  backElements: CanvasElement[];
  columnMapping: ColumnMapping;
  thumbnail?: string;
}

/** ─── Export Types ─── */

export type PdfLayout =
  | 'single'
  | 'a4-2'
  | 'a4-3'
  | 'a4-6'
  | 'a4-8';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpeg';
  pdfLayout: PdfLayout;
  quality: number; // 0-1 for JPEG
  dpi: number;
  includeFront: boolean;
  includeBack: boolean;
  outputFolder: string;
  fileNaming: 'studentId' | 'admissionNo' | 'name' | 'index';
  zipExport: boolean;
}

/** ─── Settings Types ─── */

export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'ta';

export interface AppSettings {
  defaultExportFolder: string;
  defaultTemplateId: string;
  theme: ThemeMode;
  language: Language;
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  exportDpi: number;
  pdfLayout: PdfLayout;
  showWelcome: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultExportFolder: '',
  defaultTemplateId: '',
  theme: 'dark',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 5,
  exportDpi: 300,
  pdfLayout: 'a4-8',
  showWelcome: true,
};

/** ─── Toast Types ─── */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

/** ─── Report Types ─── */

export interface GenerationReport {
  totalRecords: number;
  matchedPhotos: number;
  missingPhotos: number;
  generatedCards: number;
  failedCards: number;
  startTime: string;
  endTime: string;
  duration: number; // ms
  errors: string[];
}

/** ─── Navigation ─── */

export type PageId =
  | 'dashboard'
  | 'import'
  | 'photos'
  | 'designer'
  | 'templates'
  | 'preview'
  | 'export'
  | 'search'
  | 'reports'
  | 'settings';
