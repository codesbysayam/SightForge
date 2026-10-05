'use client';

import React, { useState } from 'react';
import { 
  Settings, Sliders, Shield, Database, Key, Check, Save, Zap, Camera
} from 'lucide-react';
import { BRAND } from '../config/brand';

export default function SettingsView() {
  const [personConfidence, setPersonConfidence] = useState(0.35);
  const [personIoU, setPersonIoU] = useState(0.45);
  const [keypointConfidence, setKeypointConfidence] = useState(0.35);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [poseEnabled, setPoseEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Platform Settings
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Configure computer vision hyperparameters, tracking algorithms, and edge telemetry.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs"
        >
          {saved ? <Check size={14} className="text-[#111310]" /> : <Save size={14} />}
          <span>{saved ? 'Saved Successfully' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="space-y-6 text-xs">
        {/* CV Inference Card */}
        <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1B1D1A] flex items-center gap-2 pb-2 border-b border-[#D9DCD5]">
            <Zap size={16} className="text-[#E7B900]" />
            <span>Detection & Pose Hyperparameters</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="font-semibold text-[#1B1D1A] block mb-1">
                Default Person Confidence ({Math.round(personConfidence * 100)}%)
              </label>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.05"
                value={personConfidence}
                onChange={(e) => setPersonConfidence(parseFloat(e.target.value))}
                className="w-full accent-[#E7B900] cursor-pointer"
              />
              <p className="text-[11px] text-[#747A73] mt-1">
                Recommended threshold: 35% (0.35) for real-time person inference.
              </p>
            </div>

            <div>
              <label className="font-semibold text-[#1B1D1A] block mb-1">
                Non-Maximum Suppression IoU ({Math.round(personIoU * 100)}%)
              </label>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={personIoU}
                onChange={(e) => setPersonIoU(parseFloat(e.target.value))}
                className="w-full accent-[#E7B900] cursor-pointer"
              />
              <p className="text-[11px] text-[#747A73] mt-1">
                Recommended threshold: 45% (0.45) for bounding box overlap filtering.
              </p>
            </div>
          </div>
        </div>

        {/* Tracking & Pose Modules */}
        <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1B1D1A] flex items-center gap-2 pb-2 border-b border-[#D9DCD5]">
            <Sliders size={16} className="text-[#3F8F5B]" />
            <span>Model Capabilities & Tracking</span>
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5] cursor-pointer">
              <div>
                <div className="font-semibold text-[#1B1D1A]">ByteTrack Multi-Object Tracking</div>
                <div className="text-[11px] text-[#747A73]">Assign persistent track IDs across sequential frames</div>
              </div>
              <input
                type="checkbox"
                checked={trackingEnabled}
                onChange={(e) => setTrackingEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#3F8F5B] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5] cursor-pointer">
              <div>
                <div className="font-semibold text-[#1B1D1A]">Human Pose Estimation (17 Keypoints)</div>
                <div className="text-[11px] text-[#747A73]">Calculate facial landmarks (eyes/nose/ears) and body skeleton</div>
              </div>
              <input
                type="checkbox"
                checked={poseEnabled}
                onChange={(e) => setPoseEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#3F8F5B] cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
