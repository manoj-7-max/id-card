import { Copy, Download, FilePlus2, FolderInput, Palette, Save } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { useToast } from '../hooks/useToast';
import { cloneTemplate, createBlankTemplate, exportTemplate, importTemplate, saveTemplate } from '../services/templateService';
import { sampleTemplate } from '../templates/sampleTemplate';
import type { Template } from '../types';

export default function TemplatesPage() {
  const { state, dispatch } = useApp();
  const toast = useToast();

  const setTemplates = (templates: Template[]) => dispatch({ type: 'SET_TEMPLATES', payload: templates });

  const addTemplate = (template: Template) => {
    const next = [...state.templates.filter((item) => item.id !== template.id), template];
    setTemplates(next);
    dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: template });
  };

  return (
    <>
      <PageHeader
        title="Template Manager"
        subtitle="Create, edit, duplicate, import, and export template JSON files locally."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => addTemplate(createBlankTemplate())}><FilePlus2 size={16} /> New</button>
            <button className="btn btn-primary" onClick={() => addTemplate(sampleTemplate)}><Palette size={16} /> Sample</button>
          </>
        }
      />
      <div className="template-grid">
        {state.templates.map((template) => (
          <article className={`template-card glass-card ${state.activeTemplate?.id === template.id ? 'selected' : ''}`} key={template.id}>
            <div className="template-thumb" style={{ aspectRatio: `${template.canvasWidth}/${template.canvasHeight}` }}>
              <span>{template.name}</span>
            </div>
            <h3>{template.name}</h3>
            <p>{template.description}</p>
            <div className="template-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'SET_ACTIVE_TEMPLATE', payload: template })}>Use</button>
              <button className="btn btn-secondary btn-sm" title="Duplicate" onClick={() => addTemplate(cloneTemplate(template))}><Copy size={14} /></button>
              <button className="btn btn-secondary btn-sm" title="Save" onClick={async () => { await saveTemplate(template); toast.success('Template saved.'); }}><Save size={14} /></button>
              <button className="btn btn-secondary btn-sm" title="Export" onClick={() => exportTemplate(template)}><Download size={14} /></button>
            </div>
          </article>
        ))}
        {!state.templates.length ? <div className="empty-state"><div className="empty-state-title">No templates yet.</div></div> : null}
      </div>
      <div className="glass-card-static panel">
        <button className="btn btn-secondary" onClick={async () => {
          const template = await importTemplate();
          if (template) {
            addTemplate(template);
            toast.success('Template imported.');
          }
        }}><FolderInput size={16} /> Import Template JSON</button>
      </div>
    </>
  );
}
