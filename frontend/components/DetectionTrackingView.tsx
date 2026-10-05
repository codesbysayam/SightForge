'use client';

import React, { useState } from 'react';
import { 
  Scan, Layers, Zap, SlidersHorizontal, Activity, 
  CheckCircle2, ArrowRight, ShieldCheck, Cpu
} from 'lucide-react';
import { CLASS_COLORS } from './CameraStream';

export default function DetectionTrackingView() {
  const [trackerAlgorithm, setTrackerAlgorithm] = useState<'bytetrack' | 'botsort'>('bytetrack');
  const [trackBuffer, setTrackBuffer] = useState<number>(30);
  const [matchThreshold, setMatchThreshold] = useState<number>(0.8);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Detection & Multi-Object Tracking
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Configure YOLOv8 detector parameters, ByteTrack tracker buffers, and association metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detection Card */}
        <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#1B1D1A] flex items-center gap-2 pb-2 border-b border-[#D9DCD5]">
            <Scan size={16} className="text-[#3F8F5B]" />
            <span>YOLOv8 Detection Configuration</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="font-semibold text-[#1B1D1A]">Detector Checkpoint</div>
              <div className="font-mono text-[11px] text-[#555B55] mt-0.5 bg-[#F7F7F3] p-2 rounded border border-[#D9DCD5]">
                models/yolov8n.pt (COCO 80 classes)
              </div>
            </div>

            <div>
              <div className="font-semibold text-[#1B1D1A]">Target Filter</div>
              <div className="text-[#555B55] mt-0.5">
                Class ID 0 (Person) dynamically resolved from model.names
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Card */}
        <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#1B1D1A] flex items-center gap-2 pb-2 border-b border-[#D9DCD5]">
            <Activity size={16} className="text-[#E7B900]" />
            <span>ByteTrack MOT Configuration</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="font-semibold text-[#1B1D1A] block mb-1">
                Track Lost Frame Buffer ({trackBuffer} frames)
              </label>
              <input
                type="range"
                min="10"
                max="60"
                value={trackBuffer}
                onChange={(e) => setTrackBuffer(parseInt(e.target.value))}
                className="w-full accent-[#E7B900]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#1B1D1A] block mb-1">
                Matching IoU Threshold ({Math.round(matchThreshold * 100)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
                className="w-full accent-[#E7B900]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
