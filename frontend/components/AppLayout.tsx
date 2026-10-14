'use client';

import React, { useState, useEffect } from 'react';
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
import SightForgeLogo from './brand/SightForgeLogo';
import { BRAND } from '../config/brand';
import { LayoutDashboard, Camera, Scan, BarChart3, Menu } from 'lucide-react';

export default function AppLayout() {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<string>('cameras');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Auto-collapse sidebar on tablets/smaller desktops to optimize canvas workspace
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1100) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F7F3] text-[#1B1D1A] p-6 font-sans">
        <div className="animate-pulse mb-3">
          <SightForgeLogo size="lg" variant="mark" />
        </div>
        <p className="text-xs text-[#555B55] font-medium">
          Initializing {BRAND.name}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full bg-[#F7F7F3] text-[#1B1D1A] flex flex-col font-sans transition-colors selection:bg-[#FFF1A8] selection:text-[#1B1D1A] overflow-x-hidden">
      {/* Responsive Header (h-14 on mobile, h-16 on tablet/desktop) */}
      <Header
        currentView={currentView}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onSelectView={(v) => setCurrentView(v)}
      />

      {/* Main Body with Persistent/Collapsible Sidebar + Fluid Content Area */}
      <div className="flex-1 flex flex-col md:flex-row w-full min-w-0 overflow-x-hidden relative">
        {/* Responsive Sidebar (Mobile Drawer + Collapsible Tablet/Desktop Rail) */}
        <Sidebar
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Fluid Primary Content Container with Responsive Spacing and Ultrawide Scaling */}
        <main className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 lg:p-7 xl:p-8 2xl:max-w-[1720px] 3xl:max-w-[2160px] mx-auto pb-20 md:pb-8 transition-all">
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

      {/* Mobile Bottom Navigation Bar (Visible on < md viewports for one-thumb navigation) */}
      <nav 
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#D9DCD5] py-1.5 px-3 flex items-center justify-around md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none"
        aria-label="Mobile quick navigation"
      >
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'cameras', label: 'Cameras', icon: Camera },
          { id: 'detection-tracking', label: 'Tracking', icon: Scan },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = 
            currentView === tab.id || 
            (tab.id === 'detection-tracking' && (currentView === 'detection' || currentView === 'tracking'));
          
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-all ${
                isActive ? 'text-[#1B1D1A] font-bold' : 'text-[#747A73] hover:text-[#1B1D1A]'
              }`}
            >
              <div className={`p-1 rounded-md transition-colors ${isActive ? 'bg-[#FFF9E8] text-[#E7B900]' : ''}`}>
                <Icon size={18} />
              </div>
              <span className="mt-0.5 leading-none">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold text-[#747A73] hover:text-[#1B1D1A] transition-all"
        >
          <div className="p-1 rounded-md">
            <Menu size={18} />
          </div>
          <span className="mt-0.5 leading-none">Menu</span>
        </button>
      </nav>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectView={(v) => setCurrentView(v)}
      />
    </div>
  );
}
