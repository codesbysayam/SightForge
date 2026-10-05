'use client';

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import CameraStream from './CameraStream';
import OverviewView from './OverviewView';
import VideoAnalysisView from './VideoAnalysisView';
import ImageAnalysisView from './ImageAnalysisView';
import DetectionTrackingView from './DetectionTrackingView';
import AnalyticsView from './AnalyticsView';
import ReportsView from './ReportsView';
import SystemStatusView from './SystemStatusView';
import DocumentationView from './DocumentationView';
import SettingsView from './SettingsView';

export default function AppLayout() {
  const [currentView, setCurrentView] = useState<string>('cameras');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#F7F7F3] text-[#1B1D1A] flex flex-col font-sans transition-colors selection:bg-[#FFF1A8] selection:text-[#1B1D1A]">
      {/* 64px Header */}
      <Header
        currentView={currentView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSelectView={(v) => setCurrentView(v)}
      />

      {/* Main Body with Persistent 240px Sidebar + Fluid Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent 240px Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Primary Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'overview' && (
            <OverviewView
              onNavigateToCameras={() => setCurrentView('cameras')}
              onNavigateToView={(v) => setCurrentView(v)}
            />
          )}

          {currentView === 'cameras' && (
            <CameraStream />
          )}

          {currentView === 'video-analysis' && (
            <VideoAnalysisView />
          )}

          {currentView === 'image-analysis' && (
            <ImageAnalysisView />
          )}

          {(currentView === 'detection-tracking' || currentView === 'detection' || currentView === 'tracking') && (
            <DetectionTrackingView />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'system' && (
            <SystemStatusView />
          )}

          {currentView === 'documentation' && (
            <DocumentationView />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(v) => setCurrentView(v)}
      />
    </div>
  );
}
