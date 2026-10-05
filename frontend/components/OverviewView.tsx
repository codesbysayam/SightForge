'use client';

import React from 'react';
import { 
  Camera, Scan, Cpu, Activity, Clock, ShieldCheck, 
  ArrowUpRight, AlertCircle, ArrowRight, Play, CheckCircle2, User, Eye, Zap
} from 'lucide-react';
import { BRAND } from '../config/brand';

interface OverviewViewProps {
  onNavigateToCameras: () => void;
  onNavigateToView: (viewId: string) => void;
}

export default function OverviewView({
  onNavigateToCameras,
  onNavigateToView,
}: OverviewViewProps) {
  const kpiStats = [
    { label: 'Active Cameras', value: '04', sub: 'Fleet Online', icon: Camera, color: 'text-[#3F8F5B]', bg: 'bg-[#EEF8F0]' },
    { label: 'Persons Detected', value: '01', sub: 'Live Feed', icon: User, color: 'text-[#3F8F5B]', bg: 'bg-[#EEF8F0]' },
    { label: 'Active Tracks', value: '01', sub: 'ByteTrack ID', icon: Activity, color: 'text-[#E7B900]', bg: 'bg-[#FFF9E8]' },
    { label: 'Inference Latency', value: '18ms', sub: 'YOLOv8 Edge', icon: Zap, color: 'text-[#4D78A8]', bg: 'bg-[#E6EEF7]' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A] font-sans">
            Platform Overview
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Fleet monitoring, real-time edge telemetry, and computer vision status.
          </p>
        </div>

        <button
          onClick={onNavigateToCameras}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs"
        >
          <Play size={14} />
          <span>Launch Live Cameras</span>
        </button>
      </div>

      {/* KPI Cards Row (Using Arial Black font numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-xl bg-white border border-[#D9DCD5] shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#747A73] uppercase tracking-wider">
                <span>{stat.label}</span>
                <div className={`p-1.5 rounded-md ${stat.bg}`}>
                  <Icon size={16} className={stat.color} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="sf-kpi text-3xl sm:text-4xl text-[#1B1D1A]">
                  {stat.value}
                </span>
                <span className="text-xs font-medium text-[#555B55]">
                  {stat.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Preview Card */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9DCD5]">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1B1D1A]">
              <Camera size={16} className="text-[#3F8F5B]" />
              <span>Primary Edge Stream</span>
            </div>
            <span className="text-[11px] font-semibold text-[#3F8F5B] bg-[#EEF8F0] px-2 py-0.5 rounded">
              Live Hardware
            </span>
          </div>

          <div 
            onClick={onNavigateToCameras}
            className="aspect-video bg-[#111310] rounded-lg overflow-hidden relative cursor-pointer group flex items-center justify-center border border-[#D9DCD5]"
          >
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1280&q=80" 
              alt="Live feed preview" 
              className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="px-4 py-2 rounded-lg bg-white/95 backdrop-blur-xs font-semibold text-xs text-[#1B1D1A] flex items-center gap-2 shadow-md">
                <Play size={14} className="text-[#E7B900]" />
                <span>Open Camera Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Engine Status & Modules */}
        <div className="p-5 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
          <div className="font-bold text-sm text-[#1B1D1A] pb-2 border-b border-[#D9DCD5]">
            Engine Capabilities
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[#EEF8F0] border border-[#3F8F5B]/30 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#3F8F5B] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#1B1D1A]">Person Detection</div>
                <div className="text-[#555B55] mt-0.5">COCO Class ID 0 · YOLOv8 35% Confidence</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#FFF9E8] border border-[#E7B900]/30 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#E7B900] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#1B1D1A]">Human Pose (17 Keypoints)</div>
                <div className="text-[#555B55] mt-0.5">Eyes, nose, ears & body skeleton active</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#E6EEF7] border border-[#4D78A8]/30 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-[#4D78A8] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#1B1D1A]">ByteTrack Tracking</div>
                <div className="text-[#555B55] mt-0.5">Persistent ID assignment across frames</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
