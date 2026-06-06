"use client";

import React from 'react';
import TopToolbar from './TopToolbar';
import LeftSidebar from './LeftSidebar';
import RightPropertiesPanel from './RightPropertiesPanel';
import CenterCanvas from './CenterCanvas';
import ImportModal from '@/components/data/ImportModal';

export default function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden text-gray-900 font-sans">
      <TopToolbar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <CenterCanvas />
        <RightPropertiesPanel />
      </div>
      <ImportModal />
      {children}
    </div>
  );
}
