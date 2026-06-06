import React, { useState } from 'react';
import { Download, Undo, Redo, Settings, Database, ChevronLeft, ChevronRight, Printer, Save } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { useDataStore } from '@/store/useDataStore';
import ExportModal from '../export/ExportModal';
import { createTemplate, updateTemplate } from '@/actions/templateActions';

export default function TopToolbar() {
  const { zoomLevel, exportToJSON, activeTemplateId, activeTemplateName, setActiveTemplate, undo, redo, past, future, activeFace, setActiveFace } = useEditorStore();
  const { setImportModalOpen, rows, activeRowIndex, setActiveRowIndex } = useDataStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleSaveTemplate = async () => {
    const json = exportToJSON();
    if (activeTemplateId && activeTemplateName) {
      await updateTemplate(activeTemplateId, activeTemplateName, json);
      alert(`Saved "${activeTemplateName}" successfully!`);
    } else {
      const name = prompt("Enter a name for this template:", "New Template");
      if (!name) return;
      const record = await createTemplate(name, json);
      setActiveTemplate(record.id, record.name);
      alert(`Created template "${record.name}" successfully!`);
    }
  };

  const handleExportJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center space-x-4">
        <h1 className="font-bold text-lg text-blue-600">ID Generator Pro</h1>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <button onClick={undo} disabled={past.length === 0} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-30 transition-colors" title="Undo"><Undo size={18} /></button>
        <button onClick={redo} disabled={future.length === 0} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 disabled:opacity-30 transition-colors" title="Redo"><Redo size={18} /></button>
        <div className="h-6 w-px bg-gray-300 mx-2"></div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveFace('front')}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeFace === 'front' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Front
          </button>
          <button 
            onClick={() => setActiveFace('back')}
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeFace === 'back' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Back
          </button>
        </div>
      </div>

      {rows.length > 0 && activeRowIndex !== null && (
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200 absolute left-1/2 -translate-x-1/2">
          <button 
            onClick={() => setActiveRowIndex(Math.max(0, activeRowIndex - 1))}
            disabled={activeRowIndex === 0}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-gray-700 w-24 text-center">
            Record {activeRowIndex + 1} / {rows.length}
          </span>
          <button 
            onClick={() => setActiveRowIndex(Math.min(rows.length - 1, activeRowIndex + 1))}
            disabled={activeRowIndex === rows.length - 1}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500 font-medium">{zoomLevel}%</div>
        <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"><Settings size={18} /></button>
        <button onClick={() => setImportModalOpen(true)} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-semibold shadow-sm">
          <Database size={16} />
          <span>Import Data</span>
        </button>
        <div className="flex items-center space-x-3">
        <button onClick={handleExportJSON} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Download JSON">
          <Download size={16} />
        </button>
        <button onClick={handleSaveTemplate} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm">
          <Save size={16} />
          <span className="max-w-[120px] truncate">{activeTemplateId ? `Save: ${activeTemplateName}` : 'Save Template'}</span>
        </button>
        {rows.length > 0 && (
          <button onClick={() => setIsExportModalOpen(true)} className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-semibold shadow-sm">
            <Printer size={16} />
            <span>Export & Print</span>
          </button>
        )}
        </div>
      </div>

      {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} />}
    </div>
  );
}
