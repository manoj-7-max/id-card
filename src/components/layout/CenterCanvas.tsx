"use client";

import React from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import dynamic from 'next/dynamic';

const IDCanvas = dynamic(() => import('@/components/canvas/IDCanvas'), {
  ssr: false,
});

export default function CenterCanvas() {
  const { setSelectedElementId, zoomLevel } = useEditorStore();

  return (
    <div 
      className="flex-1 bg-[#F3F4F6] overflow-auto flex items-center justify-center p-8 relative"
      onClick={() => setSelectedElementId(null)}
    >
      <div 
        className="bg-white shadow-2xl relative transition-transform duration-200 origin-center"
        style={{ transform: `scale(${zoomLevel / 100})` }}
      >
        <IDCanvas />
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 bg-white shadow-md rounded-lg p-1.5 flex items-center space-x-1 border border-gray-200">
        <button 
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md text-gray-600 font-bold transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            useEditorStore.setState(s => ({ zoomLevel: Math.max(20, s.zoomLevel - 10) }));
          }}
        >-</button>
        <div className="w-14 flex items-center justify-center text-xs font-semibold text-gray-700">{zoomLevel}%</div>
        <button 
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md text-gray-600 font-bold transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            useEditorStore.setState(s => ({ zoomLevel: Math.min(300, s.zoomLevel + 10) }));
          }}
        >+</button>
      </div>
    </div>
  );
}
