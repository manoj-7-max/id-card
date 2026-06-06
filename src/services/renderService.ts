import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import type { CanvasElement, ColumnMapping, StudentRecord, Template } from '../types';
import { readField, resolvePlaceholders } from '../utils/fields';
import { getRecordPhotoPath } from './photoService';

export type RenderSide = 'front' | 'back';

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      imageCache.set(src, image);
      resolve(image);
    };
    image.onerror = reject;
    image.src = src;
  });
}

async function barcodeDataUrl(value: string, width: number, height: number) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value || ' ', {
    format: 'CODE128',
    displayValue: true,
    width: Math.max(1, width / 240),
    height: Math.max(40, height * 0.58),
    margin: 0,
    font: 'Noto Sans',
    fontSize: 18,
  });
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg.outerHTML)))}`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 0) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

async function drawElement(
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  record: StudentRecord,
  recordIndex: number,
  mapping: ColumnMapping,
  matchedPhotos: Map<string, string>
) {
  if (!element.visible) return;

  ctx.save();
  ctx.globalAlpha = element.opacity ?? 1;
  ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
  ctx.rotate(((element.rotation || 0) * Math.PI) / 180);
  ctx.translate(-element.width / 2, -element.height / 2);

  if (element.type === 'shape' || element.type === 'background') {
    ctx.fillStyle = element.backgroundColor || element.fill || '#e2e8f0';
    roundedRect(ctx, 0, 0, element.width, element.height, element.cornerRadius || 0);
    ctx.fill();
    if (element.stroke && element.strokeWidth) {
      ctx.strokeStyle = element.stroke;
      ctx.lineWidth = element.strokeWidth;
      ctx.stroke();
    }
  }

  if (element.type === 'line') {
    const points = element.points || [0, 0, element.width, 0];
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.strokeStyle = element.stroke || '#0f172a';
    ctx.lineWidth = element.strokeWidth || 4;
    ctx.stroke();
  }

  if (element.type === 'text') {
    const text = resolvePlaceholders(element.text || '', record, mapping);
    ctx.fillStyle = element.fill || '#0f172a';
    ctx.font = `${element.fontWeight || '400'} ${element.fontSize || 24}px ${element.fontFamily || 'Noto Sans'}`;
    ctx.textAlign = element.align || 'left';
    ctx.textBaseline = 'top';
    const lineHeight = (element.fontSize || 24) * (element.lineHeight || 1.2);
    const x = element.align === 'center' ? element.width / 2 : element.align === 'right' ? element.width : 0;
    
    // Auto-wrap text
    const paragraphs = text.split(/\r?\n/);
    let currentY = 0;
    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > element.width && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }

  if (element.type === 'photo' || element.type === 'image' || element.type === 'logo') {
    let src = element.src || '';
    if (element.type === 'photo') {
      const path = getRecordPhotoPath(record, recordIndex, mapping, matchedPhotos);
      src = path || '';
    }
    const isCircle = element.frameShape === 'circle';
    const radius = Math.min(element.width, element.height) / 2;

    if (src) {
      try {
        const image = await loadImage(src);
        ctx.save();
        if (isCircle) {
          ctx.beginPath();
          ctx.arc(element.width / 2, element.height / 2, radius, 0, Math.PI * 2);
          ctx.clip();
        } else {
          roundedRect(ctx, 0, 0, element.width, element.height, element.cornerRadius || 0);
          ctx.clip();
        }
        drawCoverImage(ctx, image, 0, 0, element.width, element.height);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#e2e8f0';
        if (isCircle) {
          ctx.beginPath(); ctx.arc(element.width / 2, element.height / 2, radius, 0, Math.PI * 2); ctx.fill();
        } else {
          roundedRect(ctx, 0, 0, element.width, element.height, element.cornerRadius || 0); ctx.fill();
        }
      }
    } else {
      ctx.fillStyle = '#e2e8f0';
      if (isCircle) {
        ctx.beginPath(); ctx.arc(element.width / 2, element.height / 2, radius, 0, Math.PI * 2); ctx.fill();
      } else {
        roundedRect(ctx, 0, 0, element.width, element.height, element.cornerRadius || 0); ctx.fill();
      }
      ctx.fillStyle = '#64748b';
      ctx.font = '700 28px Noto Sans';
      ctx.textAlign = 'center';
      ctx.fillText('NO PHOTO', element.width / 2, element.height / 2 - 14);
    }
    if (element.borderWidth && element.borderWidth > 0) {
      ctx.strokeStyle = element.borderColor || '#ffffff';
      ctx.lineWidth = element.borderWidth;
      if (isCircle) {
        ctx.beginPath(); ctx.arc(element.width / 2, element.height / 2, radius, 0, Math.PI * 2); ctx.stroke();
      } else {
        roundedRect(ctx, 0, 0, element.width, element.height, element.cornerRadius || 0); ctx.stroke();
      }
    }
  }

  if (element.type === 'qrcode') {
    const payload =
      element.qrDataType === 'json'
        ? JSON.stringify({
            name: readField(record, mapping, 'Name'),
            class: readField(record, mapping, 'Class'),
            id: readField(record, mapping, 'StudentID'),
          })
        : element.qrDataType === 'custom'
          ? resolvePlaceholders(element.qrCustomData || '', record, mapping)
          : readField(record, mapping, element.dataField || 'StudentID');
    const url = await QRCode.toDataURL(payload || ' ', { margin: 1, width: Math.max(element.width, element.height) });
    const image = await loadImage(url);
    ctx.drawImage(image, 0, 0, element.width, element.height);
  }

  if (element.type === 'barcode') {
    const value = readField(record, mapping, element.dataField || 'StudentID');
    const url = await barcodeDataUrl(value, element.width, element.height);
    const image = await loadImage(url);
    ctx.drawImage(image, 0, 0, element.width, element.height);
  }

  ctx.restore();
}

export async function renderCardToCanvas(
  template: Template,
  record: StudentRecord,
  recordIndex: number,
  side: RenderSide,
  matchedPhotos: Map<string, string>,
  scale = 1
) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(template.canvasWidth * scale);
  canvas.height = Math.round(template.canvasHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering is unavailable.');

  ctx.scale(scale, scale);
  ctx.fillStyle = template.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, template.canvasWidth, template.canvasHeight);
  if (template.backgroundImage) {
    try {
      const bgImage = await loadImage(template.backgroundImage);
      drawCoverImage(ctx, bgImage, 0, 0, template.canvasWidth, template.canvasHeight);
    } catch {}
  }

  const elements = side === 'front' ? template.frontElements : template.backElements;
  for (const element of elements) {
    await drawElement(ctx, element, record, recordIndex, template.columnMapping, matchedPhotos);
  }

  return canvas;
}

export async function renderCardDataUrl(
  template: Template,
  record: StudentRecord,
  recordIndex: number,
  side: RenderSide,
  matchedPhotos: Map<string, string>,
  mimeType: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92
) {
  const canvas = await renderCardToCanvas(template, record, recordIndex, side, matchedPhotos, 1);
  return canvas.toDataURL(mimeType, quality);
}
