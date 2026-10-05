'use client';

import React, { useState, useEffect } from 'react';
import { Bug, Activity, ShieldCheck, Clock, RefreshCw, X, Eye, Scan, Zap, Layers } from 'lucide-react';
import { CVFrame } from '../hooks/useCVFrame';

export interface CVDebugPanelProps {
  cvFrame: CVFrame;
  sourceDimensions: { width: number; height: number };
  renderedDimensions: { width: number; height: number };
  confidenceThreshold: number;
  iouThreshold: number;
  cameraName?: string;
  onClose?: () => void;
}

export default function CVDebugPanel({
  cvFrame,
  sourceDimensions,
  renderedDimensions,
  confidenceThreshold,
  iouThreshold,
  cameraName = 'Local Camera',
  onClose,
}: CVDebugPanelProps) {
  const [frameAgeMs, setFrameAgeMs] = useState<number>(0);

  // Calculate live age of active frame
  useEffect(() => {
    const timer = setInterval(() => {
      if (cvFrame.timestamp) {
        setFrameAgeMs(Math.max(0, Date.now() - cvFrame.timestamp));
      } else {
        setFrameAgeMs(0);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [cvFrame.timestamp]);

  const scaleX = sourceDimensions.width > 0 
    ? (renderedDimensions.width / sourceDimensions.width).toFixed(3) 
    : '1.000';
  const scaleY = sourceDimensions.height > 0 
    ? (renderedDimensions.height / sourceDimensions.height).toFixed(3) 
    : '1.000';

  const isStale = frameAgeMs > 800;
  const isHealthy = cvFrame.frame_id > 0 && !isStale;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#E7B900] shadow-sm text-xs space-y-4 font-sans select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between font-bold text-sm text-[#1B1D1A] pb-3 border-b border-[#D9DCD5]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FFF9E8] border border-[#E7B900]/40 text-[#E7B900]">
            <Bug size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#1B1D1A] font-bold">CV Frame Telemetry & Diagnostic</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                isHealthy 
                  ? 'bg-[#EEF8F0] text-[#3F8F5B] border border-[#3F8F5B]/30' 
                  : 'bg-[#FFF0F3] text-[#D96B83] border border-[#D96B83]/30'
              }`}>
                {isHealthy ? 'LIVE ACTIVE' : isStale ? 'STREAM STALE' : 'IDLE'}
              </span>
            </div>
            <div className="text-[11px] font-normal text-[#747A73]">
              Target: <span className="font-semibold text-[#1B1D1A]">{cameraName}</span> · Frame #{cvFrame.frame_id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-[#F7F7F3] px-2.5 py-1 rounded text-[#555B55] border border-[#D9DCD5]">
            yolov8n.pt · CPU · PyTorch 2.3
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#747A73] hover:text-[#1B1D1A] hover:bg-[#F2F3EF] transition-colors"
              aria-label="Close Debug Panel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Frame Dimensions & Core Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 text-[11px]">
        {/* Frame ID */}
        <div className="p-2.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
          <div className="text-[#747A73]">Frame ID</div>
          <div className="font-mono font-bold text-sm text-[#1B1D1A] mt-0.5">
            #{cvFrame.frame_id}
          </div>
        </div>

        {/* Source Dimensions */}
        <div className="p-2.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
          <div className="text-[#747A73]">Source Resolution</div>
          <div className="font-mono font-bold text-[#1B1D1A] mt-0.5">
            {sourceDimensions.width} × {sourceDimensions.height}
          </div>
        </div>

        {/* Rendered Stage */}
        <div className="p-2.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
          <div className="text-[#747A73]">Rendered Stage</div>
          <div className="font-mono font-bold text-[#1B1D1A] mt-0.5">
            {renderedDimensions.width} × {renderedDimensions.height}
          </div>
        </div>

        {/* Scale Ratios */}
        <div className="p-2.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
          <div className="text-[#747A73]">Scale Factor (X / Y)</div>
          <div className="font-mono font-bold text-[#1B1D1A] mt-0.5">
            {scaleX} / {scaleY}
          </div>
        </div>

        {/* Inference Latency */}
        <div className="p-2.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
          <div className="text-[#747A73]">Inference Latency</div>
          <div className="font-mono font-bold text-sm text-[#4D78A8] mt-0.5">
            {cvFrame.inference_ms} ms
          </div>
        </div>

        {/* Frame Age */}
        <div className="p-2.5 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
          <div className="text-[#747A73]">Frame Age</div>
          <div className={`font-mono font-bold text-sm mt-0.5 ${
            frameAgeMs < 200 ? 'text-[#3F8F5B]' : frameAgeMs < 600 ? 'text-[#E7B900]' : 'text-[#D96B83]'
          }`}>
            {frameAgeMs} ms
          </div>
        </div>
      </div>

      {/* Model Detection Breakdown Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
        {/* Raw Boxes */}
        <div className="p-3 rounded-lg bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-[11px] font-semibold text-[#747A73] uppercase tracking-wider">Raw YOLO Boxes</div>
          <div className={`sf-kpi text-2xl mt-1 ${cvFrame.detections.length > 0 ? 'text-[#3F8F5B]' : 'text-[#747A73]'}`}>
            {cvFrame.detections.length}
          </div>
          <div className="text-[10px] text-[#747A73] mt-0.5 font-mono">conf ≥ {Math.round(confidenceThreshold * 100)}%</div>
        </div>

        {/* Persons */}
        <div className="p-3 rounded-lg bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-[11px] font-semibold text-[#747A73] uppercase tracking-wider">Persons</div>
          <div className={`sf-kpi text-2xl mt-1 ${cvFrame.person_count > 0 ? 'text-[#3F8F5B]' : 'text-[#747A73]'}`}>
            {cvFrame.person_count}
          </div>
          <div className="text-[10px] text-[#747A73] mt-0.5 font-mono">COCO Class ID 0</div>
        </div>

        {/* Tracks */}
        <div className="p-3 rounded-lg bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-[11px] font-semibold text-[#747A73] uppercase tracking-wider">Active Tracks</div>
          <div className={`sf-kpi text-2xl mt-1 ${cvFrame.tracked_person_count > 0 ? 'text-[#E7B900]' : 'text-[#747A73]'}`}>
            {cvFrame.tracked_person_count}
          </div>
          <div className="text-[10px] text-[#747A73] mt-0.5 font-mono">ByteTrack MOT</div>
        </div>

        {/* Poses */}
        <div className="p-3 rounded-lg bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-[11px] font-semibold text-[#747A73] uppercase tracking-wider">Human Poses</div>
          <div className={`sf-kpi text-2xl mt-1 ${cvFrame.poses.length > 0 ? 'text-[#E7B900]' : 'text-[#747A73]'}`}>
            {cvFrame.poses.length}
          </div>
          <div className="text-[10px] text-[#747A73] mt-0.5 font-mono">17 Keypoints</div>
        </div>

        {/* Faces */}
        <div className="p-3 rounded-lg bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-[11px] font-semibold text-[#747A73] uppercase tracking-wider">Faces</div>
          <div className="sf-kpi text-2xl mt-1 text-[#747A73]">
            {cvFrame.faces?.length ?? 0}
          </div>
          <div className="text-[10px] text-[#747A73] mt-0.5 font-mono">Pose Landmarks</div>
        </div>
      </div>

      {/* Coordinate Space Inspection Table */}
      {cvFrame.detections.length > 0 ? (
        <div className="p-3 rounded-lg bg-[#EEF8F0] border border-[#3F8F5B]/30 space-y-2 font-mono text-[11px]">
          <div className="font-semibold text-[#3F8F5B] flex items-center justify-between font-sans">
            <span>Authoritative Frame Coordinates:</span>
            <span className="text-[10px] font-mono text-[#555B55]">Zero Ghost Cache Active</span>
          </div>
          <div className="space-y-1">
            {cvFrame.detections.map((det, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between text-[#1B1D1A] bg-white p-2 rounded border border-[#D9DCD5]">
                <div>
                  <span className="font-bold text-[#3F8F5B]">[{det.class_name}]</span> Confidence: <span className="font-bold">{Math.round(det.confidence * 100)}%</span> · Track ID: <span className="font-bold">{det.track_id ?? 'None'}</span>
                </div>
                <div className="text-[#555B55]">
                  Source Pixels: [x1: {Math.round(det.x1)}, y1: {Math.round(det.y1)}, x2: {Math.round(det.x2)}, y2: {Math.round(det.y2)}]
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5] text-[11px] text-[#747A73] flex items-center justify-between font-mono">
          <span>Frame State: Empty (Detections: [], Poses: [], Faces: [])</span>
          <span className="text-[#3F8F5B] font-semibold">Canvas overlay strictly cleared</span>
        </div>
      )}
    </div>
  );
}
