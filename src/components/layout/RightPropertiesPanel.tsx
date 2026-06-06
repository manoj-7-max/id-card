"use client";

import React from 'react';
import { useEditorStore, CanvasElement } from '@/store/useEditorStore';
import { useDataStore } from '@/store/useDataStore';
import { Trash2, Copy, Link as LinkIcon } from 'lucide-react';

export default function RightPropertiesPanel() {
  const { selectedElementId, elements, updateElement, removeElement, duplicateElement } = useEditorStore();
  const columns = useDataStore((state) => state.columns);
  
  const element = elements.find(el => el.id === selectedElementId);

  if (!element) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 shrink-0 flex flex-col shadow-sm z-10">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="font-bold text-sm text-gray-800">Properties</h2>
        </div>
        <div className="p-6 text-center text-sm text-gray-400 mt-10">
          Select an element to view properties.
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 shrink-0 flex flex-col shadow-sm z-10">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h2 className="font-bold text-sm text-gray-800">Properties</h2>
        <div className="flex space-x-2">
          <button onClick={() => duplicateElement(element.id)} className="text-gray-500 hover:text-blue-600"><Copy size={16} /></button>
          <button onClick={() => removeElement(element.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Data Mapping Section */}
        {columns.length > 0 && (
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <label className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
              <LinkIcon size={14} /> Data Mapping
            </label>
            <select 
              value={element.mappedColumn || ''} 
              onChange={(e) => updateElement(element.id, { mappedColumn: e.target.value || undefined })}
              className="w-full border border-blue-200 rounded p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Static)</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">X</label>
            <input type="number" value={Math.round(element.x)} onChange={(e) => updateElement(element.id, { x: Number(e.target.value) })} className="w-full border rounded p-1 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Y</label>
            <input type="number" value={Math.round(element.y)} onChange={(e) => updateElement(element.id, { y: Number(e.target.value) })} className="w-full border rounded p-1 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Width</label>
            <input type="number" value={Math.round(element.width)} onChange={(e) => updateElement(element.id, { width: Number(e.target.value) })} className="w-full border rounded p-1 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Height</label>
            <input type="number" value={Math.round(element.height)} onChange={(e) => updateElement(element.id, { height: Number(e.target.value) })} className="w-full border rounded p-1 text-sm" />
          </div>
        </div>

        {element.type === 'IMAGE' && (
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Frame Shape</label>
            <select 
              value={element.maskType || 'NONE'} 
              onChange={(e) => updateElement(element.id, { maskType: e.target.value as CanvasElement['maskType'] })}
              className="w-full border border-gray-200 rounded p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NONE">None (Rectangle)</option>
              <option value="CIRCLE">Circle</option>
              <option value="OVAL">Oval</option>
              <option value="ROUNDED_RECTANGLE">Rounded Rectangle</option>
              <option value="HEXAGON">Hexagon</option>
            </select>
          </div>
        )}

        {element.type === 'TEXT' && (
          <>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Text Content</label>
              <textarea 
                value={element.text || ''} 
                onChange={(e) => updateElement(element.id, { text: e.target.value })}
                className="w-full border rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Color</label>
              <input type="color" value={element.fill || '#000000'} onChange={(e) => updateElement(element.id, { fill: e.target.value })} className="w-full h-8 cursor-pointer rounded border border-gray-200" />
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="flex items-center space-x-2 text-sm text-gray-700 font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={element.wordWrap || false} 
                  onChange={(e) => updateElement(element.id, { wordWrap: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Word Wrap</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-700 font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={element.autoFit || false} 
                  onChange={(e) => updateElement(element.id, { autoFit: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Auto Fit Box</span>
              </label>
            </div>
          </>
        )}

        {element.type === 'QRCODE' && (
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">QR Payload</label>
            <textarea 
              value={element.qrPayload || ''} 
              onChange={(e) => updateElement(element.id, { qrPayload: e.target.value })}
              className="w-full border rounded p-2 text-sm"
            />
          </div>
        )}

        {element.type === 'BARCODE' && (
          <>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Barcode Payload</label>
              <input 
                type="text"
                value={element.qrPayload || ''} 
                onChange={(e) => updateElement(element.id, { qrPayload: e.target.value })}
                className="w-full border rounded p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Barcode Format</label>
              <select 
                value={element.barcodeFormat || 'CODE128'} 
                onChange={(e) => updateElement(element.id, { barcodeFormat: e.target.value })}
                className="w-full border border-gray-200 rounded p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CODE128">CODE128 (Standard)</option>
                <option value="CODE39">CODE39</option>
                <option value="EAN13">EAN13</option>
                <option value="UPC">UPC</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
