'use client';

import React from 'react';
import { 
  Camera, LayoutGrid, Activity, Settings, 
  ShieldAlert, Database, BarChart3, HelpCircle,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    { id: 'cameras', label: 'Live Cameras', icon: Camera, badge: 'Live' },
    { id: 'fleet', label: 'Fleet Grid', icon: LayoutGrid },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'analytics', label: 'CV Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Zones & Alerts', icon: ShieldAlert },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-[#D9DCD5] select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#D9DCD5]">
        {!isCollapsed && (
          <div className="font-semibold text-xs tracking-wider uppercase text-[#747A73]">
            Workspaces
          </div>
        )}
        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[#747A73] hover:text-[#1B1D1A] hover:bg-[#F2F3EF]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
        {/* Desktop collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-[#747A73] hover:text-[#1B1D1A] hover:bg-[#F2F3EF] transition-colors ml-auto"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav items list */}
      <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto custom-scroll">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#FFF9E8] text-[#1B1D1A] font-semibold border border-[#E7B900]/40 shadow-2xs'
                  : 'text-[#555B55] hover:text-[#1B1D1A] hover:bg-[#F7F7F3]'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon 
                size={18} 
                className={isActive ? 'text-[#E7B900]' : 'text-[#747A73] shrink-0'} 
              />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF8F0] text-[#3F8F5B] font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Info Footer */}
      {!isCollapsed && (
        <div className="p-3.5 m-2.5 rounded-xl bg-[#F7F7F3] border border-[#D9DCD5] text-[11px] space-y-1">
          <div className="font-semibold text-[#1B1D1A] flex items-center justify-between">
            <span>Edge Engine</span>
            <span className="w-2 h-2 rounded-full bg-[#3F8F5B]" />
          </div>
          <p className="text-[#747A73] leading-relaxed">
            Neural model active. Zero-ghost tracking enabled.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside 
        className={`hidden md:block transition-all duration-200 shrink-0 ${
          isCollapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
}
