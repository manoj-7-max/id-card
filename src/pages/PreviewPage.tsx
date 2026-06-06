import { ChevronLeft, ChevronRight, Grid2X2, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import CardPreview from '../components/preview/CardPreview';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { readField } from '../utils/fields';

export default function PreviewPage() {
  const { state, dispatch } = useApp();
  const [grid, setGrid] = useState(false);
  const [zoom, setZoom] = useState(0.36);
  const template = state.activeTemplate;
  const record = state.students[state.previewIndex];

  if (!template || !state.students.length) {
    return <><PageHeader title="Card Preview" subtitle="Import data and select a template to preview cards." /><div className="empty-state"><div className="empty-state-title">No preview available.</div></div></>;
  }

  const currentName = readField(record, template.columnMapping, 'Name');
  const hasPhoto = state.matchedPhotos.has(readField(record, template.columnMapping, 'StudentID')) || state.matchedPhotos.has(readField(record, template.columnMapping, 'AdmissionNo'));

  return (
    <>
      <PageHeader
        title="Card Preview"
        subtitle={`${state.previewIndex + 1} of ${state.students.length} ${currentName ? `- ${currentName}` : ''}`}
        actions={
          <>
            <button className="btn btn-secondary btn-icon" title="Zoom out" onClick={() => setZoom(Math.max(0.16, zoom - 0.05))}><ZoomOut size={16} /></button>
            <button className="btn btn-secondary btn-icon" title="Zoom in" onClick={() => setZoom(Math.min(0.7, zoom + 0.05))}><ZoomIn size={16} /></button>
            <button className="btn btn-secondary btn-icon" title="Grid view" onClick={() => setGrid(!grid)}><Grid2X2 size={16} /></button>
          </>
        }
      />
      {!hasPhoto ? <div className="status-banner warning">Missing photo for this record.</div> : null}
      {grid ? (
        <div className="preview-grid">
          {state.students.slice(0, 24).map((student, index) => (
            <CardPreview key={index} template={template} record={student} recordIndex={index} side="front" matchedPhotos={state.matchedPhotos} zoom={0.2} />
          ))}
        </div>
      ) : (
        <div className="preview-stage">
          <button className="btn btn-secondary btn-icon" onClick={() => dispatch({ type: 'SET_PREVIEW_INDEX', payload: Math.max(0, state.previewIndex - 1) })}><ChevronLeft size={18} /></button>
          <div className="preview-pair">
            <CardPreview template={template} record={record} recordIndex={state.previewIndex} side="front" matchedPhotos={state.matchedPhotos} zoom={zoom} />
            <CardPreview template={template} record={record} recordIndex={state.previewIndex} side="back" matchedPhotos={state.matchedPhotos} zoom={zoom} />
          </div>
          <button className="btn btn-secondary btn-icon" onClick={() => dispatch({ type: 'SET_PREVIEW_INDEX', payload: Math.min(state.students.length - 1, state.previewIndex + 1) })}><ChevronRight size={18} /></button>
        </div>
      )}
    </>
  );
}
