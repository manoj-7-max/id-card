import React, { useState } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { useDataStore } from '@/store/useDataStore';
import { runBulkExport, ExportFormat, ExportImageQuality } from '@/utils/exportEngine';
import { X, FileDown, Layers, FileImage, Download } from 'lucide-react';

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const { elements, backgroundUrlFront, backgroundUrlBack, canvasSize } = useEditorStore();
  const { rows, uploadedPhotos, isGenerating, generationProgress, generationTotal, setGenerationState } = useDataStore();

  const [format, setFormat] = useState<ExportFormat>('A4_PDF');
  const [mimeType, setMimeType] = useState<ExportImageQuality>('image/jpeg');
  const [pixelRatio, setPixelRatio] = useState<number>(2);

  const handleExport = async () => {
    try {
      await runBulkExport(
        rows,
        elements,
        uploadedPhotos,
        canvasSize,
        backgroundUrlFront,
        backgroundUrlBack,
        { format, mimeType, pixelRatio },
        (current, total) => setGenerationState(true, current, total)
      );
    } catch (e) {
      console.error(e);
      alert("An error occurred during export.");
    } finally {
      setGenerationState(false, 0, 0);
      onClose();
    }
  };

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-[400px] p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Generating ID Cards...</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(generationProgress / generationTotal) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-4">
            {generationProgress} of {generationTotal} cards processed
          </p>
          {generationProgress === generationTotal ? (
            <p className="text-xs text-blue-600 font-semibold animate-pulse">Finalizing export file... Please wait.</p>
          ) : (
            <p className="text-xs text-gray-500">Please do not close this window.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-[500px] max-w-[90vw] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-800">Export Options</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Export Layout Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setFormat('A4_PDF')} className={`p-3 border rounded-lg flex items-center text-left transition-all ${format === 'A4_PDF' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                <Layers className="text-blue-500 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-gray-800">A4 Print Layout</div>
                  <div className="text-xs text-gray-500">Auto-arranged grids</div>
                </div>
              </button>
              <button onClick={() => setFormat('COMBINED_PDF')} className={`p-3 border rounded-lg flex items-center text-left transition-all ${format === 'COMBINED_PDF' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                <FileDown className="text-purple-500 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-gray-800">Single PDF</div>
                  <div className="text-xs text-gray-500">1 Card per Page</div>
                </div>
              </button>
              <button onClick={() => setFormat('ZIP_PDFS')} className={`p-3 border rounded-lg flex items-center text-left transition-all ${format === 'ZIP_PDFS' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                <FileDown className="text-green-500 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-gray-800">Individual PDFs</div>
                  <div className="text-xs text-gray-500">ZIP archive of PDFs</div>
                </div>
              </button>
              <button onClick={() => setFormat('ZIP_IMAGES')} className={`p-3 border rounded-lg flex items-center text-left transition-all ${format === 'ZIP_IMAGES' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}>
                <FileImage className="text-orange-500 mr-3 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-gray-800">Images (ZIP)</div>
                  <div className="text-xs text-gray-500">Raw JPEG/PNG files</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image Compression</label>
              <select value={mimeType} onChange={(e) => setMimeType(e.target.value as ExportImageQuality)} className="w-full border border-gray-300 p-2 rounded-md bg-white text-sm">
                <option value="image/jpeg">JPEG (Smaller Size)</option>
                <option value="image/png">PNG (Lossless & Alpha)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rendering Resolution</label>
              <select value={pixelRatio} onChange={(e) => setPixelRatio(Number(e.target.value))} className="w-full border border-gray-300 p-2 rounded-md bg-white text-sm">
                <option value={1}>Standard (1x) - Web Quality</option>
                <option value={2}>Print (2x) - Recommended</option>
                <option value={3}>High-Res (3x) - Slowest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-200 rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={handleExport} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm transition-colors flex items-center">
            <Download size={18} className="mr-2" />
            Generate {rows.length} Cards
          </button>
        </div>
      </div>
    </div>
  );
}
