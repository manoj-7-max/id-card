"use client";

import React, { useRef, useState, useEffect } from 'react';
import { LayoutTemplate, Shapes, Type, Image as ImageIcon, Layers, Upload, Copy, Trash2, FileUp } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { getTemplates, deleteTemplate, createTemplate, TemplateRecord } from '@/actions/templateActions';
import { useDataStore } from '@/store/useDataStore';
import { useMissingPhotos } from '@/hooks/useMissingPhotos';

export default function LeftSidebar() {
  const { activePanel, setActivePanel, addElement, elements, reorderElement, setSelectedElementId, selectedElementId, setBackgroundImage, loadFromJSON, setActiveTemplate, activeTemplateId, activeFace } = useEditorStore();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);

  const fetchTemplates = async () => {
    const data = await getTemplates();
    setTemplates(data);
  };

  useEffect(() => {
    // eslint-disable-next-line
    if (activePanel === 'templates') fetchTemplates();
  }, [activePanel]);

  const handleLoadTemplate = (t: TemplateRecord) => {
    loadFromJSON(t.json_data);
    setActiveTemplate(t.id, t.name);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate(id);
      if (activeTemplateId === id) setActiveTemplate(null, null);
      fetchTemplates();
    }
  };

  const handleDuplicateTemplate = async (t: TemplateRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt("Enter a name for the duplicate:", `${t.name} (Copy)`);
    if (!newName) return;
    await createTemplate(newName, t.json_data);
    fetchTemplates();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bulkPhotoInputRef = useRef<HTMLInputElement>(null);
  
  const { addUploadedPhotos, uploadedPhotos } = useDataStore();
  const missingPhotos = useMissingPhotos();

  const tabs = [
    { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
    { id: 'elements', icon: Shapes, label: 'Elements' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'images', icon: ImageIcon, label: 'Images' },
    { id: 'layers', icon: Layers, label: 'Layers' },
  ] as const;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isBg: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (isBg) {
        setBackgroundImage(url, activeFace);
      } else {
        addElement('IMAGE', { src: url, width: 200, height: 200 });
      }
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex shrink-0 shadow-sm z-10">
      <div className="w-20 flex flex-col items-center py-4 border-r border-gray-100 bg-gray-50/50">
        {tabs.map((tab) => {
          const isActive = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id as "templates" | "elements" | "text" | "images" | "layers")}
              className={`p-3 mb-2 rounded-xl flex flex-col items-center justify-center transition-all ${isActive ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
            >
              <tab.icon size={22} className="mb-1.5" />
              <span className="text-[10px] font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto">
        <h2 className="font-bold text-lg mb-6 capitalize text-gray-800">{activePanel}</h2>
        
        {activePanel === 'templates' && (
          <div className="space-y-3">
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No templates saved yet.</p>
            ) : (
              templates.map(t => (
                <div key={t.id} className={`p-3 border rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group ${activeTemplateId === t.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'}`} onClick={() => handleLoadTemplate(t)}>
                  <div className="font-semibold text-sm text-gray-800 truncate mb-1">{t.name}</div>
                  <div className="text-[10px] text-gray-500 mb-3">
                    {new Date(t.updated_at).toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleLoadTemplate(t); }} className="flex-1 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 flex justify-center items-center">
                      <FileUp size={14} className="mr-1" /> Load
                    </button>
                    <button onClick={(e) => handleDuplicateTemplate(t, e)} className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={(e) => handleDeleteTemplate(t.id, e)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activePanel === 'text' && (
          <button 
            className="w-full py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
            onClick={() => addElement('TEXT', { text: 'Heading', fontSize: 40 })}
          >
            Add Text
          </button>
        )}

        {activePanel === 'images' && (
          <div className="space-y-4">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => handleImageUpload(e, false)} />
            <button 
              className="w-full py-2 bg-blue-100 text-blue-700 font-semibold rounded shadow-sm hover:bg-blue-200 flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} className="mr-2" /> Upload Image
            </button>

            <input type="file" accept="image/*" className="hidden" ref={bgInputRef} onChange={e => handleImageUpload(e, true)} />
            <button 
              className="w-full py-2 bg-gray-100 text-gray-700 font-semibold rounded shadow-sm hover:bg-gray-200 flex items-center justify-center"
              onClick={() => bgInputRef.current?.click()}
            >
              Set Background
            </button>

            <hr className="my-4 border-gray-200" />
            
            <h3 className="font-bold text-sm text-gray-700">Bulk Photo Matching</h3>
            <p className="text-xs text-gray-500">Upload multiple photos to automatically map them to Excel data.</p>
            
            <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" ref={bulkPhotoInputRef} onChange={(e) => {
              if (e.target.files) addUploadedPhotos(Array.from(e.target.files));
            }} />
            <button 
              className="w-full py-2 bg-green-100 text-green-700 font-semibold rounded shadow-sm hover:bg-green-200 flex items-center justify-center"
              onClick={() => bulkPhotoInputRef.current?.click()}
            >
              <Upload size={18} className="mr-2" /> Upload Bulk Photos
            </button>

            {Object.keys(uploadedPhotos).length > 0 && (
              <div className="text-xs font-semibold text-green-600 bg-green-50 p-2 rounded border border-green-200">
                ✓ {Object.keys(uploadedPhotos).length} Photos Indexed
              </div>
            )}

            {missingPhotos.length > 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
                <h4 className="text-xs font-bold text-red-700 mb-2">Missing Photos ({missingPhotos.length})</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {missingPhotos.map((m, i) => (
                    <div key={i} className="text-[11px] text-red-600 truncate" title={m.expectedName}>
                      Row {m.rowNumber}: <span className="font-medium">{m.expectedName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activePanel === 'elements' && (
          <div className="space-y-3">
            <button 
              className="w-full py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700"
              onClick={() => addElement('QRCODE', { qrPayload: 'https://example.com', width: 150, height: 150 })}
            >
              Add QR Code
            </button>
            <button 
              className="w-full py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
              onClick={() => addElement('BARCODE', { qrPayload: '123456789', width: 200, height: 80 })}
            >
              Add Barcode
            </button>
          </div>
        )}

        {activePanel === 'layers' && (
          <div className="space-y-2">
            {[...elements].filter(el => el.face === activeFace).sort((a, b) => b.zIndex - a.zIndex).map((el) => (
              <div 
                key={el.id} 
                className={`p-2 border rounded flex justify-between items-center cursor-pointer ${selectedElementId === el.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                onClick={() => setSelectedElementId(el.id)}
              >
                <span className="text-sm font-medium">{el.type}</span>
                <div className="flex space-x-1">
                  <button className="text-xs p-1 hover:bg-gray-200 rounded" onClick={(e) => { e.stopPropagation(); reorderElement(el.id, 'up'); }}>Up</button>
                  <button className="text-xs p-1 hover:bg-gray-200 rounded" onClick={(e) => { e.stopPropagation(); reorderElement(el.id, 'down'); }}>Dn</button>
                </div>
              </div>
            ))}
            {elements.filter(el => el.face === activeFace).length === 0 && <p className="text-sm text-gray-500 text-center">No layers</p>}
          </div>
        )}
      </div>
    </div>
  );
}
