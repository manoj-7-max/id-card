import { PDFDocument, PageSizes } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CanvasElement } from '@/store/useEditorStore';
import { generateCardBlob } from './canvasGenerator';

export type ExportFormat = 'ZIP_IMAGES' | 'ZIP_PDFS' | 'COMBINED_PDF' | 'A4_PDF';
export type ExportImageQuality = 'image/jpeg' | 'image/png';

export interface ExportConfig {
  format: ExportFormat;
  mimeType: ExportImageQuality;
  pixelRatio: number;
}

export const runBulkExport = async (
  rows: Record<string, unknown>[],
  elements: CanvasElement[],
  uploadedPhotos: Record<string, string>,
  canvasSize: { width: number; height: number },
  backgroundUrlFront: string | null,
  backgroundUrlBack: string | null,
  config: ExportConfig,
  onProgress: (current: number, total: number, message?: string) => void
) => {
  const total = rows.length;
  if (total === 0) return;

  const frontElements = elements.filter(el => el.face === 'front' || !el.face);
  const backElements = elements.filter(el => el.face === 'back');
  const hasBack = backElements.length > 0 || !!backgroundUrlBack;

  onProgress(0, total, "Initializing export...");

  const zip = new JSZip();
  const combinedPdfDoc = (config.format === 'COMBINED_PDF' || config.format === 'A4_PDF') ? await PDFDocument.create() : null;

  const A4_WIDTH = PageSizes.A4[0];
  const A4_HEIGHT = PageSizes.A4[1];
  const MARGIN = 20;

  let currentA4Page = config.format === 'A4_PDF' ? combinedPdfDoc!.addPage(PageSizes.A4) : null;
  let currentX = MARGIN;
  let currentY = A4_HEIGHT - MARGIN;
  
  let scaledWidth = canvasSize.width;
  let scaledHeight = canvasSize.height;

  if (config.format === 'A4_PDF') {
    const maxWidth = A4_WIDTH - MARGIN * 2;
    const maxHeight = A4_HEIGHT - MARGIN * 2;
    if (scaledWidth > maxWidth || scaledHeight > maxHeight) {
      const ratio = Math.min(maxWidth / scaledWidth, maxHeight / scaledHeight);
      scaledWidth *= ratio;
      scaledHeight *= ratio;
    }
  }

  const processBlob = async (blob: Blob, i: number, suffix: string) => {
    const ext = config.mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const fileName = `card_${i + 1}${suffix}.${ext}`;
    const arrayBuffer = await blob.arrayBuffer();

    if (config.format === 'ZIP_IMAGES') {
      zip.file(fileName, arrayBuffer);
    } 
    else if (config.format === 'ZIP_PDFS') {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([canvasSize.width, canvasSize.height]);
      const image = config.mimeType === 'image/jpeg' ? await pdfDoc.embedJpg(arrayBuffer) : await pdfDoc.embedPng(arrayBuffer);
      page.drawImage(image, { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
      const pdfBytes = await pdfDoc.save();
      zip.file(`card_${i + 1}${suffix}.pdf`, pdfBytes);
    }
    else if (config.format === 'COMBINED_PDF') {
      const page = combinedPdfDoc!.addPage([canvasSize.width, canvasSize.height]);
      const image = config.mimeType === 'image/jpeg' ? await combinedPdfDoc!.embedJpg(arrayBuffer) : await combinedPdfDoc!.embedPng(arrayBuffer);
      page.drawImage(image, { x: 0, y: 0, width: canvasSize.width, height: canvasSize.height });
    }
    else if (config.format === 'A4_PDF') {
      if (currentX + scaledWidth > A4_WIDTH - MARGIN) {
        currentX = MARGIN;
        currentY -= scaledHeight + MARGIN;
      }
      if (currentY - scaledHeight < MARGIN) {
        currentA4Page = combinedPdfDoc!.addPage(PageSizes.A4);
        currentX = MARGIN;
        currentY = A4_HEIGHT - MARGIN;
      }

      const image = config.mimeType === 'image/jpeg' ? await combinedPdfDoc!.embedJpg(arrayBuffer) : await combinedPdfDoc!.embedPng(arrayBuffer);
      
      currentA4Page!.drawImage(image, { 
        x: currentX, 
        y: currentY - scaledHeight, 
        width: scaledWidth, 
        height: scaledHeight 
      });

      currentX += scaledWidth + MARGIN;
    }
  };

  for (let i = 0; i < total; i++) {
    const frontBlob = await generateCardBlob(frontElements, rows[i], uploadedPhotos, canvasSize, backgroundUrlFront, {
      mimeType: config.mimeType,
      pixelRatio: config.pixelRatio
    });

    await processBlob(frontBlob, i, hasBack ? '_front' : '');

    if (hasBack) {
      const backBlob = await generateCardBlob(backElements, rows[i], uploadedPhotos, canvasSize, backgroundUrlBack, {
        mimeType: config.mimeType,
        pixelRatio: config.pixelRatio
      });
      await processBlob(backBlob, i, '_back');
    }

    onProgress(i + 1, total, `Processing card ${i + 1} of ${total}...`);

    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  onProgress(total, total, "Finalizing export file...");
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  if (config.format === 'ZIP_IMAGES' || config.format === 'ZIP_PDFS') {
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'bulk_id_cards.zip');
  } 
  else if (config.format === 'COMBINED_PDF' || config.format === 'A4_PDF') {
    const pdfBytes = await combinedPdfDoc!.save();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, 'bulk_id_cards.pdf');
  }
};
