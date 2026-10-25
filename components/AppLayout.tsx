'use client';

import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import CameraStream from './CameraStream';
import { Camera, LayoutGrid, Activity, BarChart3, Settings } from 'lucide-react';

export default function AppLayout() {
  const [currentTab, setCurrentTab] = useState('cameras');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F3] text-[#1B1D1A]">
      {/* Top Header */}
      <Header
        activeCameraCount={3}
        totalCameraCount={4}
        totalTracks={0}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Body */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Workspace Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 w-full max-w-[1920px] mx-auto custom-scroll">
          {currentTab === 'cameras' && <CameraStream />}
          {currentTab === 'fleet' && (
            <div className="p-8 bg-white rounded-xl border border-[#D9DCD5] text-center space-y-2">
              <h2 className="text-lg font-bold">Fleet Multi-Grid View</h2>
              <p className="text-xs text-[#747A73]">4 simultaneous edge channels configured with hardware-accelerated WebGL inference.</p>
              <button 
                onClick={() => setCurrentTab('cameras')}
                className="mt-4 px-4 py-2 bg-[#E7B900] text-[#111310] font-semibold text-xs rounded-lg hover:bg-[#D4A800]"
              >
                Return to Live Viewport
              </button>
            </div>
          )}
          {currentTab === 'activity' && (
            <div className="p-8 bg-white rounded-xl border border-[#D9DCD5] text-center space-y-2">
              <h2 className="text-lg font-bold">Real-time Activity Log</h2>
              <p className="text-xs text-[#747A73]">Historical timeline of person tracking events, zone boundaries, and detections.</p>
              <button 
                onClick={() => setCurrentTab('cameras')}
                className="mt-4 px-4 py-2 bg-[#E7B900] text-[#111310] font-semibold text-xs rounded-lg hover:bg-[#D4A800]"
              >
                Return to Live Viewport
              </button>
            </div>
          )}
          {currentTab === 'analytics' && (
            <div className="p-8 bg-white rounded-xl border border-[#D9DCD5] text-center space-y-2">
              <h2 className="text-lg font-bold">Computer Vision Analytics</h2>
              <p className="text-xs text-[#747A73]">Occupancy metrics, dwell times, and edge inference latency diagnostics.</p>
              <button 
                onClick={() => setCurrentTab('cameras')}
                className="mt-4 px-4 py-2 bg-[#E7B900] text-[#111310] font-semibold text-xs rounded-lg hover:bg-[#D4A800]"
              >
                Return to Live Viewport
              </button>
            </div>
          )}
          {currentTab === 'settings' && (
            <div className="p-8 bg-white rounded-xl border border-[#D9DCD5] text-center space-y-2">
              <h2 className="text-lg font-bold">System Settings</h2>
              <p className="text-xs text-[#747A73]">Configure RTSP gateways, GPU inference accelerators, and notifications.</p>
              <button 
                onClick={() => setCurrentTab('cameras')}
                className="mt-4 px-4 py-2 bg-[#E7B900] text-[#111310] font-semibold text-xs rounded-lg hover:bg-[#D4A800]"
              >
                Return to Live Viewport
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Quick-Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#D9DCD5] z-30 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setCurrentTab('cameras')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'cameras' ? 'text-[#E7B900]' : 'text-[#747A73]'
          }`}
        >
          <Camera size={18} />
          <span>Cameras</span>
        </button>
        <button
          onClick={() => setCurrentTab('fleet')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'fleet' ? 'text-[#E7B900]' : 'text-[#747A73]'
          }`}
        >
          <LayoutGrid size={18} />
          <span>Fleet</span>
        </button>
        <button
          onClick={() => setCurrentTab('activity')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'activity' ? 'text-[#E7B900]' : 'text-[#747A73]'
          }`}
        >
          <Activity size={18} />
          <span>Activity</span>
        </button>
        <button
          onClick={() => setCurrentTab('analytics')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'analytics' ? 'text-[#E7B900]' : 'text-[#747A73]'
          }`}
        >
          <BarChart3 size={18} />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'settings' ? 'text-[#E7B900]' : 'text-[#747A73]'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
