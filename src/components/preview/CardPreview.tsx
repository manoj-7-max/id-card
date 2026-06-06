import { useEffect, useState } from 'react';
import type { StudentRecord, Template } from '../../types';
import { renderCardDataUrl, type RenderSide } from '../../services/renderService';

export default function CardPreview({
  template,
  record,
  recordIndex,
  side,
  matchedPhotos,
  zoom = 0.32,
}: {
  template: Template;
  record: StudentRecord;
  recordIndex: number;
  side: RenderSide;
  matchedPhotos: Map<string, string>;
  zoom?: number;
}) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let cancelled = false;
    renderCardDataUrl(template, record, recordIndex, side, matchedPhotos).then((dataUrl) => {
      if (!cancelled) setSrc(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [template, record, recordIndex, side, matchedPhotos]);

  return (
    <div className="preview-frame" style={{ width: template.canvasWidth * zoom }}>
      {src ? (
        <img
          src={src}
          alt={`${side} card preview`}
          style={{ width: template.canvasWidth * zoom, height: template.canvasHeight * zoom }}
        />
      ) : (
        <div className="preview-loading" style={{ width: template.canvasWidth * zoom, height: template.canvasHeight * zoom }}>
          Rendering
        </div>
      )}
    </div>
  );
}
