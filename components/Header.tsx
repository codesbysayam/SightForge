'use client';

import React from 'react';
import { 
  Camera, Activity, Cpu, ShieldCheck, 
  Menu, Bell, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { BRAND } from '../config/brand';

interface HeaderProps {
  activeCameraCount: number;
  totalCameraCount: number;
  totalTracks: number;
  liveLatencyMs?: number;
  onToggleMobileMenu?: () => void;
}

export default function Header({
  activeCameraCount,
  totalCameraCount,
  totalTracks,
  liveLatencyMs = 18.2,
  onToggleMobileMenu,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#D9DCD5] px-4 sm:px-6 lg:px-8 py-3 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + App Brand Title */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-[#555B55] hover:text-[#1B1D1A] hover:bg-[#F2F3EF] transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E7B900] flex items-center justify-center font-bold text-[#111310] shadow-xs">
              <Camera size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#1B1D1A]">
                  {BRAND.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFF9E8] text-[#E7B900] border border-[#E7B900]/30 font-semibold">
                  v{BRAND.version}
                </span>
              </div>
              <p className="hidden sm:block text-xs text-[#747A73] leading-none mt-0.5">
                {BRAND.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Fleet KPI Badges (hidden on extra small screens) */}
        <div className="hidden sm:flex items-center gap-2.5 md:gap-3 text-xs">
          {/* Active Cameras Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
            <span className="w-2 h-2 rounded-full bg-[#3F8F5B] animate-pulse" />
            <span className="text-[#555B55]">Feeds:</span>
            <span className="font-mono font-bold text-[#1B1D1A]">
              {activeCameraCount}/{totalCameraCount}
            </span>
          </div>

          {/* Active Tracks */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
            <Activity size={14} className="text-[#E7B900]" />
            <span className="text-[#555B55]">Tracks:</span>
            <span className="font-mono font-bold text-[#1B1D1A]">
              {totalTracks}
            </span>
          </div>

          {/* Inference Latency */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
            <Cpu size={14} className="text-[#4D78A8]" />
            <span className="text-[#555B55]">Latency:</span>
            <span className="font-mono font-bold text-[#4D78A8]">
              {liveLatencyMs} ms
            </span>
          </div>
        </div>

        {/* Right: Engine Engine badge & User Profile */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF8F0] border border-[#3F8F5B]/30 text-[#3F8F5B] text-[11px] font-semibold">
            <CheckCircle2 size={13} />
            <span>COCO-SSD Edge</span>
          </div>

          <div className="h-4 w-px bg-[#D9DCD5] hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E7B900]/20 border border-[#E7B900]/40 flex items-center justify-center font-bold text-xs text-[#1B1D1A]">
              OP
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="font-semibold text-[#1B1D1A]">Vision Operator</div>
              <div className="text-[11px] text-[#747A73]">Station #01</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
