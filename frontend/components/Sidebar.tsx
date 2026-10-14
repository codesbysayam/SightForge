'use client';

import React, { useEffect } from 'react';
import { 
  LayoutDashboard, Camera, Film, Image as ImageIcon, Scan, Activity, 
  BarChart3, FileText, Server, BookOpen, Settings, X, Circle,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  currentView,
  onSelectView,
  isMobileOpen,
  onCloseMobile,
  activeCameraCount = 4,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

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

  const renderNavList = (items: NavItem[], isCompact: boolean = false) => (
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
              title={isCompact ? item.label : undefined}
              className={`w-full flex items-center ${
                isCompact ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } rounded-lg text-[13px] font-medium transition-all relative group ${
                isActive
                  ? isCompact
                    ? 'bg-[#FFF9E8] text-[#1B1D1A] font-semibold ring-2 ring-[#E7B900] shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                    : 'bg-[#FFF9E8] text-[#1B1D1A] font-semibold border-l-[3px] border-[#E7B900] shadow-[0_1px_2px_rgba(0,0,0,0.02)] pl-2.5'
                  : 'text-[#555B55] hover:bg-[#F2F3EF] hover:text-[#1B1D1A]'
              }`}
            >
              <div className={`flex items-center ${isCompact ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-[#E7B900]' : 'text-[#747A73] group-hover:text-[#1B1D1A]'
                  }`}
                />
                {!isCompact && <span className="truncate">{item.label}</span>}
              </div>
              {!isCompact && item.badge !== undefined && (
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
              {isCompact && item.badge !== undefined && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E7B900]" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer (Visible on < md when isMobileOpen is true) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-[#D9DCD5] shadow-2xl flex flex-col justify-between transition-transform duration-200 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-[#D9DCD5] flex items-center justify-between bg-[#F7F7F3]">
          <SightForgeLogo size="sm" showWordmark />
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-[#747A73] hover:text-[#1B1D1A] rounded-lg hover:bg-white active:scale-95 transition-all"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-5 custom-scroll">
          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
              Monitoring
            </div>
            {renderNavList(monitoringNav, false)}
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
              Analysis
            </div>
            {renderNavList(analysisNav, false)}
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
              System
            </div>
            {renderNavList(systemNav, false)}
          </div>
        </div>

        {/* Drawer Footer */}
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
      </div>

      {/* Persistent Desktop / Tablet Sidebar (Hidden on mobile, sticky and fluid on md+) */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 border-r border-[#D9DCD5] bg-white sticky top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] z-20 transition-[width] duration-200 ease-in-out select-none ${
          isCollapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Navigation Sections */}
        <div className={`p-2.5 flex-1 overflow-y-auto space-y-5 custom-scroll ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
                Monitoring
              </div>
            )}
            {renderNavList(monitoringNav, isCollapsed)}
          </div>

          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
                Analysis
              </div>
            )}
            {renderNavList(analysisNav, isCollapsed)}
          </div>

          <div>
            {!isCollapsed && (
              <div className="px-3 pb-1.5 text-[11px] font-semibold text-[#747A73] uppercase tracking-wider font-sans">
                System
              </div>
            )}
            {renderNavList(systemNav, isCollapsed)}
          </div>
        </div>

        {/* Bottom Area: Edge Status Card + Collapse Toggle */}
        <div className={`border-t border-[#D9DCD5] bg-[#F7F7F3] ${isCollapsed ? 'p-2' : 'p-3'} space-y-2`}>
          {!isCollapsed ? (
            <div 
              onClick={() => onSelectView('system')}
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
          ) : (
            <div 
              onClick={() => onSelectView('system')}
              title="Edge Worker: Online (YOLOv8x)"
              className="p-2 rounded-lg bg-white border border-[#D9DCD5] cursor-pointer hover:border-[#C4C9C1] transition-colors shadow-xs flex justify-center items-center"
            >
              <Circle size={8} className="fill-[#3F8F5B] text-[#3F8F5B] animate-pulse" />
            </div>
          )}

          {/* Sidebar Collapse Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-1.5'
              } rounded-lg text-xs font-semibold text-[#747A73] hover:text-[#1B1D1A] hover:bg-[#F2F3EF] transition-colors`}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {!isCollapsed && <span>Collapse Sidebar</span>}
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
