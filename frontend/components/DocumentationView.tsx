'use client';

import React from 'react';
import { BookOpen, Code, Terminal, Server, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { BRAND } from '../config/brand';

export default function DocumentationView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-[#D9DCD5] pb-4">
        <h1 className="sf-report-title text-3xl font-bold text-[#1B1D1A]">
          {BRAND.name} Technical Documentation
        </h1>
        <p className="text-sm text-[#555B55] mt-1 font-sans">
          Architecture, computer vision pipeline, real-time coordinate transformations, and REST APIs.
        </p>
      </div>

      <div className="space-y-6 font-sans text-xs">
        {/* Section 1: CV Pipeline Architecture */}
        <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1B1D1A] flex items-center gap-2">
            <Zap size={18} className="text-[#E7B900]" />
            <span>Computer Vision Pipeline</span>
          </h2>
          <p className="text-[#555B55] leading-relaxed">
            SIGHTFORGE executes a multi-stage real-time pipeline on edge video devices and client hardware:
          </p>
          <div className="p-4 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5] font-mono text-[11px] text-[#1B1D1A] space-y-1">
            <div>1. Video Frame Capture (1280x720 / 1920x1080)</div>
            <div>2. Foreground Luminance & Contrast Validation</div>
            <div>3. YOLOv8 Person Detection (COCO Class ID 0, default 35% confidence)</div>
            <div>4. Human Pose Estimation (17 COCO Keypoints: nose, eyes, ears, torso, limbs)</div>
            <div>5. ByteTrack Multi-Object Tracking (Persistent track IDs)</div>
            <div>6. Canvas Overlay Mapping (Exact scaleX = renderedW / srcW, scaleY = renderedH / srcH)</div>
          </div>
        </div>

        {/* Section 2: REST Endpoints */}
        <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#1B1D1A] flex items-center gap-2">
            <Server size={18} className="text-[#3F8F5B]" />
            <span>API Endpoints</span>
          </h2>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
              <div className="flex items-center gap-2 font-mono font-bold text-[#1B1D1A]">
                <span className="px-2 py-0.5 rounded bg-[#EEF8F0] text-[#3F8F5B] text-[10px]">GET</span>
                <span>/api/cv/health</span>
              </div>
              <p className="text-[#555B55] mt-1 text-[11px]">
                Returns model readiness, device specifications, and detector status.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
              <div className="flex items-center gap-2 font-mono font-bold text-[#1B1D1A]">
                <span className="px-2 py-0.5 rounded bg-[#FFF9E8] text-[#E7B900] text-[10px]">POST</span>
                <span>/api/cv/detect</span>
              </div>
              <p className="text-[#555B55] mt-1 text-[11px]">
                Accepts frame dimensions and thresholds; returns person bounding boxes and pose keypoints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
