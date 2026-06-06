import { Save } from 'lucide-react';
import TemplateDesigner from '../components/designer/TemplateDesigner';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { saveTemplate } from '../services/templateService';
import { CARD_SIZE_PRESETS } from '../types';

export default function DesignerPage() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const template = state.activeTemplate;

  const patchTemplate = (patch: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_ACTIVE_TEMPLATE', payload: { ...patch, updatedAt: new Date().toISOString() } });
  };

  const handleBackgroundUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        patchTemplate({ backgroundImage: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <>
      <PageHeader
        title="Template Designer"
        subtitle="Canva-like offline editor with placeholders, front/back design, QR, barcode, shapes, and photo slots."
        actions={
          template ? <button className="btn btn-primary" onClick={async () => { await saveTemplate(template); toast.success('Template saved locally.'); }}><Save size={16} /> Save</button> : null
        }
      />
      {template ? (
        <div className="designer-topbar glass-card-static">
          <label className="input-group">
            <span className="input-label">Template name</span>
            <input className="input" value={template.name} onChange={(event) => patchTemplate({ name: event.target.value })} />
          </label>
          <label className="input-group">
            <span className="input-label">Canvas size</span>
            <select
              className="select"
              value={`${template.canvasWidth}x${template.canvasHeight}`}
              onChange={(event) => {
                const preset = CARD_SIZE_PRESETS.find((item) => `${item.width}x${item.height}` === event.target.value);
                if (preset) patchTemplate({ canvasWidth: preset.width, canvasHeight: preset.height });
              }}
            >
              {CARD_SIZE_PRESETS.map((preset) => <option key={preset.name} value={`${preset.width}x${preset.height}`}>{preset.label}</option>)}
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">Background</span>
            <div className="flex gap-2">
              <input className="input" type="color" value={template.backgroundColor} onChange={(event) => patchTemplate({ backgroundColor: event.target.value })} />
              <button className="btn btn-secondary" onClick={handleBackgroundUpload}>Upload Image</button>
              {template.backgroundImage && <button className="btn btn-secondary" onClick={() => patchTemplate({ backgroundImage: '' })}>Clear</button>}
            </div>
          </label>
          <div className="tabs">
            <button className={`tab ${state.activeCardSide === 'front' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_CARD_SIDE', payload: 'front' })}>Front Design</button>
            <button className={`tab ${state.activeCardSide === 'back' ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_CARD_SIDE', payload: 'back' })}>Back Design</button>
          </div>
        </div>
      ) : null}
      <TemplateDesigner />
    </>
  );
}
