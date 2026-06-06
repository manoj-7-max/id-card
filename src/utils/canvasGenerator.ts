import Konva from 'konva';
import { CanvasElement } from '@/store/useEditorStore';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const generateCardBlob = async (
  elements: CanvasElement[],
  rowData: Record<string, unknown>,
  uploadedPhotos: Record<string, string>,
  canvasSize: { width: number; height: number },
  backgroundUrl: string | null,
  options: { mimeType: 'image/jpeg' | 'image/png'; pixelRatio: number } = { mimeType: 'image/jpeg', pixelRatio: 1 }
): Promise<Blob> => {
  // Create off-screen container
  const container = document.createElement('div');
  const stage = new Konva.Stage({
    container,
    width: canvasSize.width,
    height: canvasSize.height,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  // Background White
  layer.add(new Konva.Rect({
    width: canvasSize.width,
    height: canvasSize.height,
    fill: 'white',
  }));

  // Background Image
  if (backgroundUrl) {
    try {
      const bgImg = await loadImage(backgroundUrl);
      layer.add(new Konva.Image({
        image: bgImg,
        width: canvasSize.width,
        height: canvasSize.height,
      }));
    } catch (e) {
      console.error("Failed to load background image", e);
    }
  }

  // Sort elements
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sortedElements) {
    if (el.type === 'TEXT') {
      let textValue = el.text || '';
      if (el.mappedColumn) {
        textValue = String(rowData[el.mappedColumn] || '');
      }
      let finalFontSize = el.fontSize || 32;
      if (el.autoFit && textValue.length > 0) {
        const charWidth = 0.6 * finalFontSize;
        const totalTextWidth = textValue.length * charWidth;
        if (!el.wordWrap && totalTextWidth > el.width) {
           finalFontSize = Math.max(10, Math.floor(el.width / (textValue.length * 0.6)));
        }
      }

      layer.add(new Konva.Text({
        text: textValue,
        x: el.x,
        y: el.y,
        fontSize: finalFontSize,
        fontFamily: el.fontFamily,
        fill: el.fill,
        wrap: el.wordWrap ? "word" : "none",
        rotation: el.rotation,
        width: el.width,
        height: el.height,
      }));
    } else if (el.type === 'IMAGE' || el.type === 'QRCODE' || el.type === 'BARCODE') {
      let finalSrc = el.src || '';
      
      if (el.type === 'QRCODE') {
        const payload = el.mappedColumn ? String(rowData[el.mappedColumn] || '') : (el.qrPayload || '');
        if (payload) {
          finalSrc = await QRCode.toDataURL(payload, { width: Math.max(el.width, 200), margin: 1 });
        }
      } else if (el.type === 'BARCODE') {
        const payload = el.mappedColumn ? String(rowData[el.mappedColumn] || '') : (el.qrPayload || '');
        if (payload) {
          try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, payload, {
              format: el.barcodeFormat || "CODE128",
              displayValue: true,
              margin: 10,
              background: "#ffffff",
              lineColor: "#000000"
            });
            finalSrc = canvas.toDataURL("image/png");
          } catch (e) {
            console.error("Barcode fail", e);
          }
        }
      } else if (el.type === 'IMAGE' && el.mappedColumn) {
        const cellValue = String(rowData[el.mappedColumn] || '').toLowerCase().trim();
        if (uploadedPhotos[cellValue]) {
          finalSrc = uploadedPhotos[cellValue];
        }
      }

      if (finalSrc) {
        try {
          const loadedImg = await loadImage(finalSrc);
          const group = new Konva.Group({
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            rotation: el.rotation,
            clipFunc: (!el.maskType || el.maskType === 'NONE') ? undefined : (ctx) => {
              const w = el.width;
              const h = el.height;
              const mask = el.maskType;
              ctx.beginPath();
              if (mask === 'CIRCLE') {
                ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2, false);
              } else if (mask === 'OVAL') {
                ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
              } else if (mask === 'ROUNDED_RECTANGLE') {
                const r = Math.min(20, w / 2, h / 2);
                ctx.moveTo(r, 0);
                ctx.lineTo(w - r, 0);
                ctx.quadraticCurveTo(w, 0, w, r);
                ctx.lineTo(w, h - r);
                ctx.quadraticCurveTo(w, h, w - r, h);
                ctx.lineTo(r, h);
                ctx.quadraticCurveTo(0, h, 0, h - r);
                ctx.lineTo(0, r);
                ctx.quadraticCurveTo(0, 0, r, 0);
              } else if (mask === 'HEXAGON') {
                for (let i = 0; i < 6; i++) {
                  const angle_deg = 60 * i - 30;
                  const angle_rad = Math.PI / 180 * angle_deg;
                  const px = w/2 + (w/2) * Math.cos(angle_rad);
                  const py = h/2 + (h/2) * Math.sin(angle_rad);
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
              } else {
                ctx.rect(0, 0, w, h);
              }
              ctx.closePath();
            }
          });

          group.add(new Konva.Image({
            image: loadedImg,
            width: el.width,
            height: el.height,
          }));

          layer.add(group);
        } catch (e) {
          console.error("Failed to load image for element", el.id, e);
        }
      }
    }
  }

  layer.draw();

  return new Promise((resolve) => {
    const dataUrl = stage.toDataURL({ 
      mimeType: options.mimeType, 
      quality: 0.9,
      pixelRatio: options.pixelRatio 
    });
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    stage.destroy();
    resolve(blob);
  });
};
