'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Play, Pause, Plus, Cpu, Activity, 
  Check, X, Circle, ChevronRight, Download, Video,
  Maximize2, Minimize2, SlidersHorizontal, Eye, EyeOff,
  Filter, Search, Clock, Zap, FileSpreadsheet, FileJson,
  Bug, User, Car, Truck, Package, ShieldCheck, CheckCircle2, Scan
} from 'lucide-react';
import { BRAND } from '../config/brand';
import { DetectionOverlay } from './DetectionOverlay';
import CVDebugPanel from './CVDebugPanel';
import { useCVFrame, CVDetection, CVPose, CVKeypoint } from '../hooks/useCVFrame';
import { cvEngine } from '../utils/cvEngine';

export const CLASS_COLORS: Record<string, string> = {
  'Person': '#3F8F5B',      // Forest Green
  'Car': '#4D78A8',         // Slate Blue
  'Truck': '#7C3AED',       // Violet
  'Forklift': '#E7B900',    // Warm Amber/Yellow
  'Briefcase': '#555B55',   // Charcoal
  'Backpack': '#0D9488',    // Teal
  'Box': '#D96B83',         // Soft Pink
};

export interface CameraData {
  id: string;
  name: string;
  rtsp_url: string;
  is_active: boolean;
  location: string;
  resolution: string;
  fps: number;
  bitrate: string;
  device_status: 'online' | 'standby' | 'offline';
  gpu_allocated: string;
  active_tracks: number;
  classes: string[];
  feed_url: string;
}

export interface ActivityEvent {
  id: string;
  cameraName: string;
  className: string;
  confidence: number;
  trackId: string | number;
  timestamp: string;
}

export default function CameraStream({
  onSelectCameraId,
}: {
  onSelectCameraId?: (id: string) => void;
}) {
  // Authoritative Single Source of Truth for CV Frame State
  const { 
    cvFrame, 
    detections, 
    poses, 
    personCount, 
    trackedPersonCount, 
    receiveFrame, 
    resetFrame 
  } = useCVFrame();

  // Camera fleet state
  const [cameras, setCameras] = useState<CameraData[]>([
    {
      id: 'CAM-WEBCAM',
      name: 'Local Camera (Live Hardware)',
      rtsp_url: 'webcam://localhost',
      is_active: true,
      location: 'Workstation Video Device',
      resolution: '1280x720',
      fps: 30,
      bitrate: '3200 kbps',
      device_status: 'online',
      gpu_allocated: 'Client Video Device',
      active_tracks: 0,
      classes: ['Person'],
      feed_url: ''
    },
    {
      id: 'CAM-01',
      name: 'Main Entrance & Lobby',
      rtsp_url: 'rtsp://192.168.10.50:554/stream1',
      is_active: true,
      location: 'Building A, Lobby 1',
      resolution: '1920x1080',
      fps: 30,
      bitrate: '4096 kbps',
      device_status: 'online',
      gpu_allocated: 'Edge Node 01',
      active_tracks: 0,
      classes: ['Person', 'Briefcase'],
      feed_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1280&q=80'
    },
    {
      id: 'CAM-02',
      name: 'Logistics Warehouse Bay 4',
      rtsp_url: 'rtsp://192.168.10.51:554/stream1',
      is_active: true,
      location: 'Warehouse B, Zone 3',
      resolution: '1920x1080',
      fps: 25,
      bitrate: '3500 kbps',
      device_status: 'online',
      gpu_allocated: 'Edge Node 02',
      active_tracks: 0,
      classes: ['Person', 'Forklift', 'Box'],
      feed_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1280&q=80'
    },
    {
      id: 'CAM-03',
      name: 'Assembly Line Precision QA',
      rtsp_url: 'rtsp://192.168.10.52:554/stream1',
      is_active: true,
      location: 'Factory Floor Line 2',
      resolution: '2560x1440',
      fps: 60,
      bitrate: '8192 kbps',
      device_status: 'standby',
      gpu_allocated: 'Edge Node 03',
      active_tracks: 0,
      classes: ['Person'],
      feed_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1280&q=80'
    }
  ]);

  const [selectedCam, setSelectedCam] = useState<CameraData>(cameras[0]);
  const [cameraSearch, setCameraSearch] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showTrackIds, setShowTrackIds] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showKeypoints, setShowKeypoints] = useState(true);
  const [debugMode, setDebugMode] = useState(false);

  // Confidence & IoU
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.35);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['Person']);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Telemetry metrics
  const [liveFps, setLiveFps] = useState(30);
  const [liveLatency, setLiveLatency] = useState(18.2);
  const [sourceDimensions, setSourceDimensions] = useState({ width: 1280, height: 720 });
  const [renderedDimensions, setRenderedDimensions] = useState({ width: 906, height: 509 });

  // Activity events log
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamRtsp, setNewCamRtsp] = useState('');
  const [newCamLocation, setNewCamLocation] = useState('');

  // Video & Canvas Refs
  const videoStageRef = useRef<HTMLDivElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const feedImgRef = useRef<HTMLImageElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const frameIdCounter = useRef<number>(1000);
  const prevPersonCountRef = useRef<number>(0);

  // Preload real neural network CV model
  useEffect(() => {
    cvEngine.loadModel().catch((err) => {
      console.warn('[SIGHTFORGE] COCO-SSD background preload:', err);
    });
  }, []);

  // Track rendered dimensions for overlay scaling
  useEffect(() => {
    if (!videoStageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setRenderedDimensions({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    observer.observe(videoStageRef.current);
    return () => observer.disconnect();
  }, []);

  // When switching camera, reset frame state immediately (Zero ghost carryover)
  const handleSelectCamera = (cam: CameraData) => {
    resetFrame();
    cvEngine.resetTracker();
    setSelectedCam(cam);
    if (onSelectCameraId) onSelectCameraId(cam.id);
  };

  // Webcam stream management
  useEffect(() => {
    if (selectedCam?.id === 'CAM-WEBCAM') {
      navigator.mediaDevices?.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } } 
      })
        .then((stream) => {
          webcamStreamRef.current = stream;
          setWebcamStream(stream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.onloadedmetadata = () => {
              if (webcamVideoRef.current) {
                setSourceDimensions({
                  width: webcamVideoRef.current.videoWidth || 1280,
                  height: webcamVideoRef.current.videoHeight || 720
                });
              }
            };
          }
        })
        .catch((err) => {
          console.error("Webcam hardware access error:", err);
        });

      return () => {
        if (webcamStreamRef.current) {
          webcamStreamRef.current.getTracks().forEach(t => t.stop());
          webcamStreamRef.current = null;
        }
        setWebcamStream(null);
        resetFrame();
      };
    } else {
      setSourceDimensions({ width: 1920, height: 1080 });
    }
  }, [selectedCam?.id, resetFrame]);

  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Recording timer
  useEffect(() => {
    let timer: any = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Real-time Computer Vision Processing Loop with Real Neural Network Detector
  useEffect(() => {
    if (!isPlaying || !selectedCam || selectedCam.device_status === 'offline') {
      resetFrame();
      return;
    }

    let active = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (!active) return;

      const isWebcam = selectedCam.id === 'CAM-WEBCAM';
      const t0 = performance.now();
      const currentFrameId = ++frameIdCounter.current;

      try {
        if (isWebcam && webcamVideoRef.current && webcamVideoRef.current.readyState >= 2) {
          const video = webcamVideoRef.current;
          const srcW = video.videoWidth || 1280;
          const srcH = video.videoHeight || 720;

          const { detections: realDetections, poses: realPoses } = await cvEngine.detectFrame(
            video,
            srcW,
            srcH,
            confidenceThreshold,
            selectedClasses
          );

          if (!active) return;

          const t1 = performance.now();
          const inferenceTime = Math.round((t1 - t0) * 10) / 10;
          const realPersonCount = realDetections.filter(d => d.class_name.toLowerCase() === 'person').length;
          const realTrackedCount = new Set(
            realDetections.filter(d => d.track_id != null).map(d => d.track_id)
          ).size;

          receiveFrame({
            frame_id: currentFrameId,
            timestamp: Date.now(),
            frame_width: srcW,
            frame_height: srcH,
            detections: realDetections,
            poses: realPoses,
            faces: [],
            person_count: realPersonCount,
            tracked_person_count: realTrackedCount,
            inference_ms: inferenceTime,
          });

          if (realPersonCount > 0 && prevPersonCountRef.current === 0) {
            setEvents(prev => [
              {
                id: String(Date.now()),
                cameraName: selectedCam.name,
                className: realDetections[0]?.class_name || 'Person',
                confidence: realDetections[0]?.confidence || 0.85,
                trackId: realDetections[0]?.track_id ?? 1,
                timestamp: new Date().toLocaleTimeString(),
              },
              ...prev.slice(0, 9)
            ]);
          }
          prevPersonCountRef.current = realPersonCount;
          setLiveLatency(inferenceTime);
        } else if (!isWebcam && feedImgRef.current && feedImgRef.current.complete) {
          const img = feedImgRef.current;
          const srcW = img.naturalWidth || 1920;
          const srcH = img.naturalHeight || 1080;

          const { detections: realDetections, poses: realPoses } = await cvEngine.detectFrame(
            img,
            srcW,
            srcH,
            confidenceThreshold,
            selectedClasses
          );

          if (!active) return;

          const t1 = performance.now();
          const inferenceTime = Math.round((t1 - t0) * 10) / 10;
          const realPersonCount = realDetections.filter(d => d.class_name.toLowerCase() === 'person').length;
          const realTrackedCount = new Set(
            realDetections.filter(d => d.track_id != null).map(d => d.track_id)
          ).size;

          receiveFrame({
            frame_id: currentFrameId,
            timestamp: Date.now(),
            frame_width: srcW,
            frame_height: srcH,
            detections: realDetections,
            poses: realPoses,
            faces: [],
            person_count: realPersonCount,
            tracked_person_count: realTrackedCount,
            inference_ms: inferenceTime,
          });

          prevPersonCountRef.current = realPersonCount;
          setLiveLatency(inferenceTime);
        } else {
          // Camera feed not ready yet or standby
          receiveFrame({
            frame_id: currentFrameId,
            timestamp: Date.now(),
            frame_width: 1280,
            frame_height: 720,
            detections: [],
            poses: [],
            faces: [],
            person_count: 0,
            tracked_person_count: 0,
            inference_ms: 0,
          });
          prevPersonCountRef.current = 0;
        }
      } catch (err) {
        console.error("Frame CV processing error:", err);
      }

      if (active) {
        const interval = Math.max(30, 1000 / (selectedCam?.fps || 30));
        timerId = setTimeout(tick, interval);
      }
    };

    // Kick off real inference loop
    timerId = setTimeout(tick, 50);

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [isPlaying, selectedCam, confidenceThreshold, iouThreshold, selectedClasses, receiveFrame, resetFrame]);

  // Snapshot handler
  const handleSnapshot = () => {
    if (webcamVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = webcamVideoRef.current.videoWidth || 1280;
      canvas.height = webcamVideoRef.current.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(webcamVideoRef.current, 0, 0);
        const link = document.createElement('a');
        link.download = `sightforge_capture_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  const filteredCameras = cameras.filter(c => 
    c.name.toLowerCase().includes(cameraSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(cameraSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Live Cameras
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Real-time computer vision inference, person detection, and edge tracking workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>Add Camera</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Camera List Sidebar + Live Video Stage) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera Fleet Selector (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#747A73]" />
            <input
              type="text"
              placeholder="Search cameras by name or location..."
              value={cameraSearch}
              onChange={(e) => setCameraSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#D9DCD5] text-xs text-[#1B1D1A] placeholder-[#747A73] focus:border-[#E7B900] focus:ring-1 focus:ring-[#E7B900] transition-colors"
            />
          </div>

          {/* Camera list cards */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 custom-scroll">
            {filteredCameras.map((cam) => {
              const isSelected = selectedCam.id === cam.id;
              const currentTracks = isSelected ? trackedPersonCount : 0;

              return (
                <div
                  key={cam.id}
                  onClick={() => handleSelectCamera(cam)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none bg-white ${
                    isSelected
                      ? 'border-[#E7B900] bg-[#FFF9E8] shadow-[0_2px_8px_rgba(231,185,0,0.12)]'
                      : 'border-[#D9DCD5] hover:border-[#C4C9C1] hover:bg-[#F7F7F3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#1B1D1A] truncate">
                        {cam.name}
                      </div>
                      <div className="text-xs text-[#747A73] mt-0.5 truncate">
                        {cam.location}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                        cam.device_status === 'online'
                          ? 'bg-[#EEF8F0] text-[#3F8F5B]'
                          : cam.device_status === 'standby'
                          ? 'bg-[#F2F3EF] text-[#555B55]'
                          : 'bg-[#FFF0F3] text-[#D96B83]'
                      }`}
                    >
                      {cam.device_status === 'online' ? 'Connected' : cam.device_status === 'standby' ? 'Standby' : 'Error'}
                    </span>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-2.5 pt-2 border-t border-[#D9DCD5]/60 flex items-center justify-between text-[11px] text-[#555B55]">
                    <span className="font-mono">{cam.resolution}</span>
                    <span>{cam.fps} FPS</span>
                    <span className="text-[#3F8F5B] font-medium">
                      {currentTracks} {currentTracks === 1 ? 'track' : 'tracks'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Viewport + Controls + Diagnostics (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main 16:9 Live Video Stage */}
          <div 
            ref={videoStageRef}
            className={`relative w-full rounded-xl overflow-hidden bg-[#111310] border border-[#C4C9C1] shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${
              isFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'
            }`}
          >
            {/* Live Camera Feed / Video Element */}
            {selectedCam.id === 'CAM-WEBCAM' ? (
              <video
                ref={webcamVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-contain"
              />
            ) : (
              <img
                ref={feedImgRef}
                src={selectedCam.feed_url}
                alt={selectedCam.name}
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Computer Vision Detection & Pose Canvas Overlay */}
            {showAnnotations && (
              <DetectionOverlay
                videoRef={webcamVideoRef}
                detections={detections}
                poses={poses}
                sourceWidth={sourceDimensions.width}
                sourceHeight={sourceDimensions.height}
                showLabels={showLabels}
                showConfidence={showConfidence}
                showTrackIds={showTrackIds}
                showSkeleton={showSkeleton}
                showKeypoints={showKeypoints}
                color={CLASS_COLORS['Person'] || '#3F8F5B'}
                debugMode={debugMode}
              />
            )}

            {/* Viewport Top Bar (Camera Label + Live Indicator) */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#111310]/80 backdrop-blur-xs border border-white/10 text-white text-xs">
                <span className="w-2 h-2 rounded-full bg-[#3F8F5B] animate-pulse" />
                <span className="font-semibold">{selectedCam.name}</span>
                <span className="text-white/50">|</span>
                <span className="font-mono text-[11px] text-[#E7B900]">
                  {personCount} {personCount === 1 ? 'person' : 'people'}
                </span>
                <span className="text-white/50">|</span>
                <span className="font-mono text-[11px] text-white/70">
                  {trackedPersonCount} {trackedPersonCount === 1 ? 'track' : 'tracks'}
                </span>
              </div>

              {/* Viewport Action Controls */}
              <div className="flex items-center gap-1 pointer-events-auto">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1.5 rounded bg-[#111310]/80 backdrop-blur-xs border border-white/10 text-white/80 hover:text-white hover:bg-black transition-colors"
                  title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* Viewport Bottom Floating Status */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none z-20 text-[11px] font-mono text-white/80">
              <span className="px-2 py-0.5 rounded bg-[#111310]/80 border border-white/10">
                {liveFps} FPS
              </span>
              <span className="px-2 py-0.5 rounded bg-[#111310]/80 border border-white/10">
                {liveLatency} ms
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#D96B83]/90 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  REC {recordSeconds}s
                </span>
              )}
            </div>
          </div>

          {/* Stream Toolbar (Play/Pause, Snapshot, Record, Overlays, Debug) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#D9DCD5] text-xs">
            {/* Playback & Capture Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  isPlaying
                    ? 'bg-[#F2F3EF] hover:bg-[#E5E8E2] text-[#1B1D1A]'
                    : 'bg-[#3F8F5B] hover:bg-[#34784C] text-white'
                }`}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                onClick={handleSnapshot}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F7F3] hover:bg-[#F2F3EF] text-[#555B55] hover:text-[#1B1D1A] border border-[#D9DCD5] transition-colors"
              >
                <Download size={14} />
                <span>Snapshot</span>
              </button>

              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                  isRecording
                    ? 'bg-[#FFF0F3] text-[#D96B83] border-[#D96B83]/40'
                    : 'bg-[#F7F7F3] hover:bg-[#F2F3EF] text-[#555B55] hover:text-[#1B1D1A] border-[#D9DCD5]'
                }`}
              >
                <Video size={14} />
                <span>{isRecording ? 'Stop Recording' : 'Record'}</span>
              </button>
            </div>

            {/* Overlay Display Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  showAnnotations
                    ? 'bg-[#FFF9E8] border-[#E7B900] text-[#1B1D1A]'
                    : 'bg-[#F7F7F3] border-[#D9DCD5] text-[#747A73]'
                }`}
              >
                {showAnnotations ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>Boxes</span>
              </button>

              <button
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  showSkeleton
                    ? 'bg-[#FFF9E8] border-[#E7B900] text-[#1B1D1A]'
                    : 'bg-[#F7F7F3] border-[#D9DCD5] text-[#747A73]'
                }`}
              >
                <Scan size={13} />
                <span>Pose</span>
              </button>

              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  debugMode
                    ? 'bg-[#EEF8F0] border-[#3F8F5B] text-[#3F8F5B]'
                    : 'bg-[#F7F7F3] border-[#D9DCD5] text-[#747A73]'
                }`}
              >
                <Bug size={13} />
                <span>Diagnostic</span>
              </button>
            </div>
          </div>

          {/* Model Inference Threshold Sliders */}
          <div className="p-3.5 rounded-xl bg-white border border-[#D9DCD5] space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1B1D1A]">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-[#E7B900]" />
                <span>Edge Detection Thresholds</span>
              </div>
              <span className="font-mono text-[11px] text-[#747A73]">
                Zero-Ghost Floor Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between text-[#555B55] mb-1">
                  <span>Confidence Threshold</span>
                  <span className="font-mono font-bold text-[#1B1D1A]">
                    {Math.round(confidenceThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-[#E7B900] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[#555B55] mb-1">
                  <span>ByteTrack IoU Threshold</span>
                  <span className="font-mono font-bold text-[#1B1D1A]">
                    {Math.round(iouThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.05"
                  value={iouThreshold}
                  onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                  className="w-full accent-[#E7B900] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Live Debug Panel (Toggleable) */}
          {debugMode && (
            <CVDebugPanel
              cvFrame={cvFrame}
              sourceDimensions={sourceDimensions}
              renderedDimensions={renderedDimensions}
              confidenceThreshold={confidenceThreshold}
              iouThreshold={iouThreshold}
              cameraName={selectedCam.name}
              onClose={() => setDebugMode(false)}
            />
          )}

          {/* Activity Event Feed */}
          <div className="p-4 rounded-xl bg-white border border-[#D9DCD5] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B1D1A]">
                <Clock size={14} className="text-[#3F8F5B]" />
                <span>Recent Detection Events</span>
              </div>
              <span className="text-[11px] text-[#747A73]">
                {events.length} logged
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scroll text-xs">
              {events.length > 0 ? (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F3] border border-[#ECEEEA]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F5B]" />
                      <span className="font-semibold text-[#1B1D1A]">{evt.className}</span>
                      <span className="text-[11px] font-mono text-[#555B55]">Track #{evt.trackId}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#747A73]">
                      <span>{Math.round(evt.confidence * 100)}% conf</span>
                      <span className="font-mono">{evt.timestamp}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-[#747A73]">
                  No events recorded yet. Position a person in front of the camera to trigger live tracking.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
