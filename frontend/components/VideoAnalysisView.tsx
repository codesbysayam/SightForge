'use client';

import React, { useState } from 'react';
import { 
  Film, Upload, Play, Pause, CheckCircle2, SlidersHorizontal, 
  Download, RefreshCw, FileSpreadsheet, ArrowRight, Eye, Zap
} from 'lucide-react';
import { CLASS_COLORS } from './CameraStream';

export default function VideoAnalysisView() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [modelType, setModelType] = useState<string>('yolov8x');
  const [confidence, setConfidence] = useState<number>(0.35);
  const [iou, setIou] = useState<number>(0.45);

  const startAnalysis = () => {
    setIsProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          setActiveStep(3);
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Video Analysis Pipeline
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Batch video processing, YOLOv8 inference, keypoint extraction, and audit log generation.
          </p>
        </div>
      </div>

      {/* 3-Step Wizard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { step: 1, title: 'Upload & Select Stream', desc: 'Choose video file or RTSP stream' },
          { step: 2, title: 'Hyperparameters', desc: 'Confidence, IoU, and Pose models' },
          { step: 3, title: 'Results & Export', desc: 'Trajectory tracks and telemetry' },
        ].map((s) => (
          <div
            key={s.step}
            onClick={() => setActiveStep(s.step)}
            className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
              activeStep === s.step
                ? 'border-[#E7B900] bg-[#FFF9E8] shadow-xs'
                : 'border-[#D9DCD5] hover:border-[#C4C9C1] hover:bg-[#F7F7F3]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  activeStep === s.step
                    ? 'bg-[#E7B900] text-[#111310]'
                    : 'bg-[#F2F3EF] text-[#747A73]'
                }`}
              >
                {s.step}
              </div>
              <div className="font-semibold text-xs text-[#1B1D1A]">{s.title}</div>
            </div>
            <p className="text-[11px] text-[#747A73] mt-1.5 pl-8.5">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-6 text-xs">
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1B1D1A]">Select Video Source</h3>
            <div className="border-2 border-dashed border-[#D9DCD5] rounded-xl p-8 text-center bg-[#F7F7F3] hover:bg-[#FFF9E8] transition-colors cursor-pointer">
              <Upload size={28} className="mx-auto text-[#747A73] mb-2" />
              <div className="font-semibold text-sm text-[#1B1D1A]">
                Drag and drop your video file here, or browse
              </div>
              <div className="text-[#747A73] text-[11px] mt-1">
                Supports MP4, AVI, MKV, MOV up to 500MB
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#D9DCD5]">
              <button
                onClick={() => setActiveStep(2)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs shadow-xs"
              >
                <span>Continue to Parameters</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1B1D1A]">Configure Detection Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-[#1B1D1A] block mb-1">
                  Confidence Threshold ({Math.round(confidence * 100)}%)
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

              <div>
                <label className="font-semibold text-[#1B1D1A] block mb-1">
                  IoU NMS Overlap ({Math.round(iou * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={iou}
                  onChange={(e) => setIou(parseFloat(e.target.value))}
                  className="w-full accent-[#E7B900]"
                />
              </div>
            </div>

            {isProcessing && (
              <div className="p-4 rounded-lg bg-[#FFF9E8] border border-[#E7B900]/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1B1D1A]">
                  <span>Processing Video Frames...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white border border-[#D9DCD5] overflow-hidden">
                  <div
                    style={{ width: `${progress}%` }}
                    className="h-full bg-[#E7B900] transition-all duration-200"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[#D9DCD5]">
              <button
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 rounded-lg border border-[#D9DCD5] text-xs font-semibold text-[#555B55] hover:bg-[#F2F3EF]"
              >
                Back
              </button>
              <button
                onClick={startAnalysis}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs shadow-xs disabled:opacity-50"
              >
                <Play size={14} />
                <span>{isProcessing ? 'Processing...' : 'Run Pipeline'}</span>
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1B1D1A]">Analysis Complete</h3>
              <span className="px-2.5 py-0.5 rounded bg-[#EEF8F0] text-[#3F8F5B] font-semibold text-xs">
                Success · 142 Persons Tracked
              </span>
            </div>

            <div className="p-4 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5] grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[#747A73]">Total Frames</div>
                <div className="sf-kpi text-xl text-[#1B1D1A] mt-1">1,800</div>
              </div>
              <div>
                <div className="text-[#747A73]">Avg Latency</div>
                <div className="sf-kpi text-xl text-[#3F8F5B] mt-1">16.4ms</div>
              </div>
              <div>
                <div className="text-[#747A73]">ByteTrack Tracks</div>
                <div className="sf-kpi text-xl text-[#E7B900] mt-1">142</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#D9DCD5]">
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F7F7F3] hover:bg-[#F2F3EF] border border-[#D9DCD5] text-xs font-semibold text-[#1B1D1A]">
                <FileSpreadsheet size={14} className="text-[#3F8F5B]" />
                <span>Export Detections CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
