import { PDFDocument, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ExportOptions, GenerationReport, StudentRecord, Template } from '../types';
import { readField, safeFileName } from '../utils/fields';
import { renderCardDataUrl } from './renderService';

export interface BatchProgress {
  completed: number;
  total: number;
  percent: number;
  estimatedSeconds: number;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function fileBase(record: StudentRecord, index: number, template: Template, naming: ExportOptions['fileNaming']) {
  const value =
    naming === 'studentId'
      ? readField(record, template.columnMapping, 'StudentID')
      : naming === 'admissionNo'
        ? readField(record, template.columnMapping, 'AdmissionNo')
        : naming === 'name'
          ? readField(record, template.columnMapping, 'Name')
          : String(index + 1).padStart(4, '0');
  return safeFileName(value, `card-${index + 1}`);
}

function layoutSlots(layout: ExportOptions['pdfLayout']) {
  if (layout === 'single') return { perPage: 1, cols: 1, rows: 1 };
  if (layout === 'a4-2') return { perPage: 2, cols: 2, rows: 1 };
  if (layout === 'a4-3') return { perPage: 3, cols: 3, rows: 1 };
  if (layout === 'a4-6') return { perPage: 6, cols: 2, rows: 3 };
  return { perPage: 8, cols: 2, rows: 4 };
}

export async function exportImages(
  template: Template,
  records: StudentRecord[],
  matchedPhotos: Map<string, string>,
  options: ExportOptions,
  onProgress: (progress: BatchProgress) => void
) {
  const started = performance.now();
  const report = createReport(records.length, matchedPhotos.size);
  const zip = new JSZip();
  const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const extension = options.format === 'jpeg' ? 'jpg' : 'png';
  const totalSides = records.length * Number(options.includeFront || options.includeBack) * (options.includeFront && options.includeBack ? 2 : 1);
  let completed = 0;

  for (let i = 0; i < records.length; i += 1) {
    const sides = [options.includeFront ? 'front' : null, options.includeBack ? 'back' : null].filter(Boolean) as ('front' | 'back')[];
    for (const side of sides) {
      try {
        const dataUrl = await renderCardDataUrl(template, records[i], i, side, matchedPhotos, mimeType, options.quality);
        const bytes = dataUrlToBytes(dataUrl);
        const name = `${fileBase(records[i], i, template, options.fileNaming)}-${side}.${extension}`;
        zip.file(name, bytes);
        report.generatedCards += 1;
      } catch (error) {
        report.failedCards += 1;
        report.errors.push(`Row ${i + 1}: ${String(error)}`);
      }
      completed += 1;
      onProgress(progress(completed, Math.max(1, totalSides), started));
    }
    if (i % 25 === 0) await new Promise((resolve) => setTimeout(resolve));
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  saveAs(blob, 'id-card-images.zip');
  finishReport(report, started);
  return report;
}

export async function exportPdf(
  template: Template,
  records: StudentRecord[],
  matchedPhotos: Map<string, string>,
  options: ExportOptions,
  onProgress: (progress: BatchProgress) => void
) {
  const started = performance.now();
  const report = createReport(records.length, matchedPhotos.size);
  const pdf = await PDFDocument.create();
  const a4: [number, number] = [595.28, 841.89];
  const slots = layoutSlots(options.pdfLayout);
  const pageSize: [number, number] =
    options.pdfLayout === 'single'
      ? [template.canvasWidth * 0.24, template.canvasHeight * 0.24]
      : a4;
  const margin = 24;
  const gap = 14;
  const slotWidth = (pageSize[0] - margin * 2 - gap * (slots.cols - 1)) / slots.cols;
  const slotHeight = (pageSize[1] - margin * 2 - gap * (slots.rows - 1)) / slots.rows;
  const cardRatio = template.canvasWidth / template.canvasHeight;
  const totalSides = records.length * (options.includeFront && options.includeBack ? 2 : 1);
  let completed = 0;
  let page = pdf.addPage(pageSize);
  let slotIndex = 0;

  for (let i = 0; i < records.length; i += 1) {
    const sides = [options.includeFront ? 'front' : null, options.includeBack ? 'back' : null].filter(Boolean) as ('front' | 'back')[];
    for (const side of sides) {
      try {
        if (slotIndex >= slots.perPage) {
          page = pdf.addPage(pageSize);
          slotIndex = 0;
        }
        const dataUrl = await renderCardDataUrl(template, records[i], i, side, matchedPhotos);
        const png = await pdf.embedPng(dataUrlToBytes(dataUrl));
        const col = slotIndex % slots.cols;
        const row = Math.floor(slotIndex / slots.cols);
        let width = slotWidth;
        let height = width / cardRatio;
        if (height > slotHeight) {
          height = slotHeight;
          width = height * cardRatio;
        }
        const x = margin + col * (slotWidth + gap) + (slotWidth - width) / 2;
        const y = pageSize[1] - margin - (row + 1) * slotHeight - row * gap + (slotHeight - height) / 2;
        page.drawRectangle({ x: x - 1, y: y - 1, width: width + 2, height: height + 2, color: rgb(1, 1, 1) });
        page.drawImage(png, { x, y, width, height });
        slotIndex += 1;
        report.generatedCards += 1;
      } catch (error) {
        report.failedCards += 1;
        report.errors.push(`Row ${i + 1}: ${String(error)}`);
      }
      completed += 1;
      onProgress(progress(completed, Math.max(1, totalSides), started));
    }
    if (i % 20 === 0) await new Promise((resolve) => setTimeout(resolve));
  }

  const bytes = await pdf.save();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  saveAs(blob, 'id-cards.pdf');
  finishReport(report, started);
  return report;
}

export function reportToCsv(report: GenerationReport, missing: string[]) {
  const lines = [
    'Metric,Value',
    `Total Students,${report.totalRecords}`,
    `Matched Photos,${report.matchedPhotos}`,
    `Missing Photos,${report.missingPhotos}`,
    `Generated Cards,${report.generatedCards}`,
    `Failed Cards,${report.failedCards}`,
    `Duration Ms,${report.duration}`,
    '',
    'Missing Photo Record',
    ...missing.map((item) => `"${item.replace(/"/g, '""')}"`),
  ];
  return lines.join('\n');
}

function createReport(totalRecords: number, matchedPhotos: number): GenerationReport {
  return {
    totalRecords,
    matchedPhotos,
    missingPhotos: Math.max(0, totalRecords - matchedPhotos),
    generatedCards: 0,
    failedCards: 0,
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0,
    errors: [],
  };
}

function finishReport(report: GenerationReport, started: number) {
  report.endTime = new Date().toISOString();
  report.duration = Math.round(performance.now() - started);
}

function progress(completed: number, total: number, started: number): BatchProgress {
  const elapsed = (performance.now() - started) / 1000;
  const rate = completed / Math.max(0.1, elapsed);
  const remaining = Math.max(0, total - completed);
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    estimatedSeconds: Math.round(remaining / Math.max(0.1, rate)),
  };
}
