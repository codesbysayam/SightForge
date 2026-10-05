'use client';

import React from 'react';
import { 
  LayoutDashboard, Camera, Film, Image as ImageIcon, Scan, Activity, 
  BarChart3, FileText, Server, BookOpen, Settings, X, Circle, CheckCircle2
} from 'lucide-react';
import SightForgeLogo from './brand/SightForgeLogo';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  currentView: string;
  onSelectView: (viewId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeCameraCount?: number;
}

export default function Sidebar({
  currentView,
  onSelectView,
  isMobileOpen,
  onCloseMobile,
  activeCameraCount = 4,
}: SidebarProps) {
  const monitoringNav: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cameras', label: 'Cameras', icon: Camera, badge: activeCameraCount },
    { id: 'video-analysis', label: 'Video Analysis', icon: Film },
    { id: 'image-analysis', label: 'Image Analysis', icon: ImageIcon },
  ];

  const analysisNav: NavItem[] = [
    { id: 'detection', label: 'Detection', icon: Scan },
    { id: 'tracking', label: 'Tracking', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const systemNav: NavItem[] = [
    { id: 'system', label: 'System', icon: Server },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = 
          currentView === item.id || 
          (item.id === 'detection' && currentView === 'detection-tracking') || 
          (item.id === 'tracking' && currentView === 'detection-tracking');

        return (
          <li key={item.id}>
            <button
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all relative ${
                isActive
                  ? 'bg-[#FFF9E8] text-[#1B1D1A] font-semibold border-l-[3px] border-[#E7B900] shadow-[0_1px_2px_rgba(0,0,0,0.02)] pl-2.5'
                  : 'text-[#555B55] hover:bg-[#F2F3EF] hover:text-[#1B1D1A]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={17}
                  className={`shrink-0 ${
                    isActive ? 'text-[#E7B900]' : 'text-[#747A73]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-[#FFF1A8] text-[#1B1D1A] font-bold'
                      : 'bg-[#F2F3EF] text-[#747A73]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: 240px wide, light surface, 1px border */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-40 h-full md:h-[calc(100vh-4rem)] w-[240px] shrink-0 border-r border-[#D9DCD5] bg-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-3.5 border-b border-[#D9DCD5] flex items-center justify-between md:hidden bg-[#F7F7F3]">
          <SightForgeLogo size="sm" showWordmark />
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-[#747A73] hover:text-[#1B1D1A] rounded-lg hover:bg-white"
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 flex-1 overflow-y-auto space-y-5 custom-scroll">
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
              Monitoring
            </div>
            {renderNavList(monitoringNav)}
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
              Analysis
            </div>
            {renderNavList(analysisNav)}
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
              System
            </div>
            {renderNavList(systemNav)}
          </div>
        </div>

        {/* Bottom Edge Node Card */}
        <div className="p-3 border-t border-[#D9DCD5] bg-[#F7F7F3]">
          <div 
            onClick={() => {
              onSelectView('system');
              onCloseMobile();
            }}
            className="p-2.5 rounded-lg bg-white border border-[#D9DCD5] cursor-pointer hover:border-[#C4C9C1] transition-colors shadow-xs"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-[#1B1D1A]">Edge Worker</span>
              <span className="flex items-center gap-1 text-[11px] text-[#3F8F5B] font-semibold">
                <Circle size={6} className="fill-[#3F8F5B] text-[#3F8F5B]" />
                Online
              </span>
            </div>
            <div className="text-[11px] text-[#747A73] font-medium">
              YOLOv8x · PyTorch 2.3
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
