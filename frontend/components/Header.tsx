'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Bell, ChevronDown, Check, Sliders, User, 
  ShieldCheck, Camera, Layers, Activity, Server, ArrowRight
} from 'lucide-react';
import { BRAND } from '../config/brand';
import SightForgeLogo from './brand/SightForgeLogo';

interface HeaderProps {
  currentView: string;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
  onSelectView: (viewId: string) => void;
  theme?: string;
  resolvedTheme?: string;
  onSetTheme?: (t: any) => void;
}

export default function Header({
  currentView,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  onSelectView,
}: HeaderProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('Facility A · Production Edge');

  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#D9DCD5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left Area: Mobile Drawer Toggle + Logo + Workspace Selector */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-lg text-[#555B55] hover:text-[#1B1D1A] hover:bg-[#F2F3EF] md:hidden focus-visible:outline-2 focus-visible:outline-[#E7B900]"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="cursor-pointer" onClick={() => onSelectView('cameras')}>
          <SightForgeLogo size="md" showWordmark showDescriptor={false} />
        </div>

        <div className="hidden lg:block h-5 w-px bg-[#D9DCD5] mx-1" />

        {/* Workspace Selector */}
        <div className="relative hidden lg:block" ref={workspaceRef}>
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1B1D1A] hover:bg-[#F2F3EF] border border-transparent hover:border-[#D9DCD5] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#3F8F5B]" />
            <span>{currentWorkspace}</span>
            <ChevronDown size={14} className="text-[#747A73]" />
          </button>

          {workspaceOpen && (
            <div className="absolute left-0 mt-1 w-64 rounded-lg bg-white border border-[#D9DCD5] shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-1 z-50 text-xs">
              <div className="px-3 py-1.5 font-semibold text-[10px] text-[#747A73] uppercase tracking-wider">
                Select Edge Node
              </div>
              {[
                { name: 'Facility A · Production Edge', count: '4 Cameras Active' },
                { name: 'Logistics Center B · Fleet 02', count: '3 Cameras Active' },
                { name: 'HQ Perimeter Deck · Cluster 01', count: '2 Cameras Active' },
              ].map((ws) => (
                <button
                  key={ws.name}
                  onClick={() => {
                    setCurrentWorkspace(ws.name);
                    setWorkspaceOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#FFF9E8] transition-colors ${
                    currentWorkspace === ws.name ? 'bg-[#FFF9E8] text-[#1B1D1A] font-semibold' : 'text-[#555B55]'
                  }`}
                >
                  <div>
                    <div className="font-medium text-[#1B1D1A]">{ws.name}</div>
                    <div className="text-[10px] text-[#747A73]">{ws.count}</div>
                  </div>
                  {currentWorkspace === ws.name && <Check size={14} className="text-[#3F8F5B]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Search / Command Launcher */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[#F7F7F3] hover:bg-[#F2F3EF] border border-[#D9DCD5] text-xs text-[#747A73] transition-colors group focus-visible:outline-2 focus-visible:outline-[#E7B900]"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[#747A73] group-hover:text-[#1B1D1A]" />
            <span className="font-medium">Search cameras, models, analytics...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#747A73] border border-[#D9DCD5]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Area: System Status Pill + Notification + User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-[#EEF8F0] border border-[#D9DCD5] text-xs font-semibold text-[#3F8F5B]">
          <span className="w-2 h-2 rounded-full bg-[#3F8F5B] animate-pulse" />
          <span>Engine Active</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-[#555B55] hover:text-[#1B1D1A] hover:bg-[#F2F3EF] relative transition-colors"
            aria-label="View system notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E7B900] ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-1 w-80 rounded-lg bg-white border border-[#D9DCD5] shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-[#D9DCD5] flex items-center justify-between font-semibold text-[#1B1D1A]">
                <span>System Notifications</span>
                <span className="text-[11px] font-medium text-[#3F8F5B] bg-[#EEF8F0] px-2 py-0.5 rounded">All Operational</span>
              </div>
              <div className="divide-y divide-[#D9DCD5]/60 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-[#F7F7F3] transition-colors">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1B1D1A]">
                    <ShieldCheck size={14} className="text-[#3F8F5B]" />
                    <span>YOLOv8 Detection Engine</span>
                  </div>
                  <p className="text-[11px] text-[#555B55] mt-0.5">
                    Local camera pipeline synchronized. COCO Person class loaded.
                  </p>
                  <span className="text-[10px] text-[#747A73] mt-1 block">Just now</span>
                </div>
                <div className="p-3 hover:bg-[#F7F7F3] transition-colors">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#1B1D1A]">
                    <Activity size={14} className="text-[#E7B900]" />
                    <span>ByteTrack Tracker Active</span>
                  </div>
                  <p className="text-[11px] text-[#555B55] mt-0.5">
                    Continuous track IDs enabled with IoU matching.
                  </p>
                  <span className="text-[10px] text-[#747A73] mt-1 block">5m ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F2F3EF] transition-colors"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1B1D1A] text-white flex items-center justify-center font-bold text-xs tracking-wider border border-[#D9DCD5]">
              SF
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-lg bg-white border border-[#D9DCD5] shadow-[0_4px_16px_rgba(0,0,0,0.08)] py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-[#D9DCD5]">
                <div className="font-bold text-[#1B1D1A]">Lead CV Engineer</div>
                <div className="text-[11px] text-[#747A73] font-mono">edge-admin@sightforge.internal</div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    onSelectView('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-[#555B55] hover:text-[#1B1D1A] hover:bg-[#FFF9E8] flex items-center gap-2"
                >
                  <Sliders size={14} />
                  <span>CV Settings</span>
                </button>
                <button
                  onClick={() => {
                    onSelectView('documentation');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-[#555B55] hover:text-[#1B1D1A] hover:bg-[#FFF9E8] flex items-center gap-2"
                >
                  <Server size={14} />
                  <span>API Documentation</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
