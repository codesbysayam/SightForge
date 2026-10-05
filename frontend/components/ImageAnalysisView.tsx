'use client';

import React, { useState } from 'react';
import { 
  Image as ImageIcon, Upload, Download, SlidersHorizontal, 
  Layers, Check, Zap, RefreshCw, Eye
} from 'lucide-react';
import { CLASS_COLORS } from './CameraStream';

export default function ImageAnalysisView() {
  const [confidence, setConfidence] = useState<number>(0.35);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showPose, setShowPose] = useState<boolean>(true);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Static Image Analysis
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            High-resolution object localization, keypoint inspection, and bounding box validation.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs">
          <Upload size={14} />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Image Stage & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Image Stage */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-3">
          <div className="aspect-video bg-[#111310] rounded-lg overflow-hidden relative border border-[#D9DCD5]">
            <img
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1280&q=80"
              alt="Test Image"
              className="w-full h-full object-contain"
            />

            {/* Bounding box demonstration */}
            {showBoxes && (
              <div 
                style={{ top: '20%', left: '35%', width: '22%', height: '65%' }}
                className="absolute border-2 border-[#3F8F5B] bg-[#3F8F5B]/10 rounded-sm"
              >
                <div className="absolute -top-6 left-0 bg-white text-[#1B1D1A] border border-[#D9DCD5] px-2 py-0.5 rounded text-[11px] font-semibold shadow-xs">
                  Person 88%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4 text-xs">
          <h3 className="font-bold text-sm text-[#1B1D1A]">Inference Controls</h3>

          <div>
            <label className="font-semibold text-[#1B1D1A] block mb-1">
              Confidence ({Math.round(confidence * 100)}%)
            </label>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full accent-[#E7B900]"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[#D9DCD5]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBoxes}
                onChange={(e) => setShowBoxes(e.target.checked)}
                className="w-4 h-4 accent-[#3F8F5B]"
              />
              <span className="font-medium text-[#1B1D1A]">Show Person Bounding Boxes</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPose}
                onChange={(e) => setShowPose(e.target.checked)}
                className="w-4 h-4 accent-[#3F8F5B]"
              />
              <span className="font-medium text-[#1B1D1A]">Show 17-Point Pose Skeleton</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
