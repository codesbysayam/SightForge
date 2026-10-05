'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Play, Pause, RefreshCw, Plus, Cpu, Activity, AlertTriangle, 
  CheckCircle2, SlidersHorizontal, Maximize2, Minimize2, Monitor, Wifi, WifiOff, 
  ShieldAlert, Settings, Info, Layers, Filter, Check, X, CircleDot, ChevronRight,
  Power, Bell, BellOff, User, Car, Truck, Package, Eye, Scan, Sparkles, Briefcase,
  Sun, Moon, FileSpreadsheet, FileJson, Terminal
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

// Class colors mapping
const CLASS_COLORS: Record<string, string> = {
  'Person': '#10b981',      // Emerald Green
  'Car': '#06b6d4',         // Cyan Blue
  'Truck': '#3b82f6',       // Royal Blue
  'Forklift': '#f59e0b',    // Warning Amber
  'License Plate': '#ec4899',// Hot Pink
  'Briefcase': '#8b5cf6',   // Violet Purple
  'Backpack': '#a855f7',    // Purple Accent
  'Box': '#eab308',         // Golden Yellow
  'Face': '#ec4899',        // Hot Pink for face
  'Eyes': '#3b82f6'         // Royal Blue for eyes
};

// Map classes to Lucide icons for rich on-screen overlays
const CLASS_ICONS: Record<string, React.ComponentType<any>> = {
  'Person': User,
  'Car': Car,
  'Truck': Truck,
  'Forklift': Cpu,
  'License Plate': Scan,
  'Briefcase': Briefcase, // Wait, let's make sure Briefcase is imported or fallback
  'Backpack': Activity,
  'Box': Package,
  'Face': Sparkles,
  'Eyes': Eye
};

interface CameraData {
  id: string;
  name: string;
  rtsp_url: string;
  is_active: boolean;
  location: string;
  resolution: string;
  fps: number;
  bitrate: string;
  device_status: string;
  gpu_allocated: string;
  active_tracks: number;
  classes: string[];
  feed_url: string;
}

interface BoundingBox {
  id: string;
  class: string;
  conf: number;
  // Box normalized coords or raw [x, y, width, height] relative to a 1000x1000 field
  x: number;
  y: number;
  w: number;
  h: number;
  // Velocity vectors for dynamic motion
  vx: number;
  vy: number;
}

interface ToastAlert {
  id: string;
  cameraName: string;
  className: string;
  conf: number;
  trackId: string;
  timestamp: string;
}

class KalmanFilter {
  private x: number;
  private p: number;
  private q: number;
  private r: number;

  constructor(initialVal: number, q: number = 0.03, r: number = 0.5, initialP: number = 1.0) {
    this.x = initialVal;
    this.p = initialP;
    this.q = q;
    this.r = r;
  }

  public update(measurement: number): number {
    this.p = this.p + this.q;
    const k = this.p / (this.p + this.r);
    this.x = this.x + k * (measurement - this.x);
    this.p = (1 - k) * this.p;
    return this.x;
  }
}

export default function CameraStream({
  initialStatus,
  onStatusChange,
}: {
  initialStatus?: 'live' | 'buffering' | 'offline';
  onStatusChange?: (status: 'live' | 'buffering' | 'offline') => void;
} = {}) {
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [selectedCam, setSelectedCam] = useState<CameraData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiSource, setApiSource] = useState<string>('fallback');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.35);
  const [iouThreshold, setIouThreshold] = useState<number>(0.45);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [allAvailableClasses, setAllAvailableClasses] = useState<string[]>([]);

  // Interactive Playback Controls and Stream Status Toggles
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [streamingStatus, setStreamingStatus] = useState<'live' | 'buffering' | 'offline'>(initialStatus || 'live');

  // Prop synchronization
  useEffect(() => {
    if (initialStatus) {
      setStreamingStatus(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(streamingStatus);
    }
  }, [streamingStatus, onStatusChange]);

  // Real-time telemetry indicators (animated naturally)
  const [liveFps, setLiveFps] = useState<number>(30);
  const [liveLatency, setLiveLatency] = useState<number>(14);
  const [liveBitrate, setLiveBitrate] = useState<string>('4096 kbps');
  const [liveGpuLoad, setLiveGpuLoad] = useState<number>(8);

  // Edge Processing Diagnostics State
  const [frameDropCount, setFrameDropCount] = useState<number>(0);
  const [liveVramUsage, setLiveVramUsage] = useState<number>(2.4); // in GB (out of 4.0 GB)
  const [liveRamUsage, setLiveRamUsage] = useState<number>(342.8); // in MB (out of 1024 MB)
  const [liveCpuLoad, setLiveCpuLoad] = useState<number>(18); // in %
  const [edgeTemp, setEdgeTemp] = useState<number>(49.5); // in °C
  const [latencyTrend, setLatencyTrend] = useState<number[]>([14, 15, 13, 16, 14, 15, 12, 14, 15, 13]);

  // Object detection frequency history (last 60 seconds)
  const [detectionHistory, setDetectionHistory] = useState<{ time: number; count: number }[]>([]);

  // Add Camera Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newCamName, setNewCamName] = useState<string>('');
  const [newCamRtsp, setNewCamRtsp] = useState<string>('rtsp://192.168.1.100:554/live');
  const [newCamLocation, setNewCamLocation] = useState<string>('');
  const [newCamClasses, setNewCamClasses] = useState<string[]>(['Person', 'Car']);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vt_theme');
      return saved !== 'light';
    }
    return true;
  });

  // Detailed detection event type and log state
  interface DetectionEvent {
    id: string;
    timestamp: string;
    cameraId: string;
    cameraName: string;
    className: string;
    confidence: number;
    trackId: string;
  }

  const [eventLog, setEventLog] = useState<DetectionEvent[]>([
    { id: '1', timestamp: '10:45:00', cameraId: 'CAM-101', cameraName: 'Facility Main Entrance', className: 'Car', confidence: 92, trackId: 'TRK-402' },
    { id: '2', timestamp: '10:45:15', cameraId: 'CAM-101', cameraName: 'Facility Main Entrance', className: 'Person', confidence: 88, trackId: 'TRK-403' },
    { id: '3', timestamp: '10:45:32', cameraId: 'CAM-102', cameraName: 'North Perimeter Parking', className: 'Car', confidence: 94, trackId: 'TRK-122' },
    { id: '4', timestamp: '10:46:10', cameraId: 'CAM-103', cameraName: 'Warehouse Loading Dock B', className: 'Truck', confidence: 91, trackId: 'TRK-551' },
    { id: '5', timestamp: '10:46:45', cameraId: 'CAM-101', cameraName: 'Facility Main Entrance', className: 'License Plate', confidence: 97, trackId: 'TRK-901' },
  ]);

  // Snapshot Animation State
  const [isSnapshotFlash, setIsSnapshotFlash] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<string[]>([]);

  // Toast Alert states and tracking refs
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [alertClasses, setAlertClasses] = useState<string[]>(['Person', 'Forklift', 'License Plate']);
  const alertedTracksRef = useRef<Set<string>>(new Set());
  const trackPresenceRef = useRef<Record<string, number>>({});

  // Simulation Bounding Boxes Ref for Animation Frame Loop
  const boxesRef = useRef<BoundingBox[]>([]);
  const [renderBoxes, setRenderBoxes] = useState<BoundingBox[]>([]);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Zoom & Pan States
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAutoTracking, setIsAutoTracking] = useState<boolean>(true);
  const [isKalmanEnabled, setIsKalmanEnabled] = useState<boolean>(true);

  const kalmanFiltersRef = useRef<Record<string, { x: KalmanFilter; y: KalmanFilter; w: KalmanFilter; h: KalmanFilter }>>({});

  const prevFrameBufferRef = useRef<Uint8ClampedArray | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loggedTracksRef = useRef<Set<string>>(new Set());

  // Handle CSS global theme synchronization
  useEffect(() => {
    localStorage.setItem('vt_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-slate-950 text-slate-100 transition-colors duration-300 font-sans select-none antialiased';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-slate-50 text-slate-800 transition-colors duration-300 font-sans select-none antialiased';
    }
  }, [isDark]);

  // Increase frame drops when streaming status changes to buffering
  useEffect(() => {
    if (streamingStatus === 'buffering') {
      const interval = setInterval(() => {
        setFrameDropCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [streamingStatus]);

  // Live detection event-logger (triggers when a unique trackId enters the frame)
  useEffect(() => {
    if (!isPlaying || !selectedCam || renderBoxes.length === 0 || streamingStatus !== 'live') return;
    
    const timestamp = new Date().toLocaleTimeString();
    const newEvents: DetectionEvent[] = [];
    
    renderBoxes.forEach(box => {
      const key = `${selectedCam.id}-${box.id}`;
      if (!loggedTracksRef.current.has(key)) {
        loggedTracksRef.current.add(key);
        newEvents.push({
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          cameraId: selectedCam.id,
          cameraName: selectedCam.name,
          className: box.class,
          confidence: Number((box.conf * 100).toFixed(0)),
          trackId: box.id
        });
      }
    });

    if (newEvents.length > 0) {
      setEventLog(prev => [...newEvents, ...prev].slice(0, 500));
    }
  }, [renderBoxes, isPlaying, selectedCam, streamingStatus]);

  // Reset unique track registry whenever camera source is switched
  useEffect(() => {
    loggedTracksRef.current = new Set();
  }, [selectedCam?.id]);

  // Pre-populated default cameras
  const DEFAULT_CAMERAS: CameraData[] = [
    {
      id: 'CAM-101',
      name: 'Facility Main Entrance',
      rtsp_url: 'rtsp://192.168.10.50:554/stream1',
      is_active: true,
      location: 'Building A, Lobby',
      resolution: '1920x1080',
      fps: 90,
      bitrate: '4096 kbps',
      device_status: 'online',
      gpu_allocated: 'GPU-0 (8%)',
      active_tracks: 5,
      classes: ['Person', 'Backpack', 'Briefcase'],
      feed_url: 'https://picsum.photos/seed/gate/800/450'
    },
    {
      id: 'CAM-WEBCAM',
      name: 'Local Laptop Webcam (Live Test)',
      rtsp_url: 'webcam://localhost',
      is_active: true,
      location: 'User Workspace Base',
      resolution: 'Dynamic Webcam',
      fps: 60,
      bitrate: 'Dynamic WebRTC',
      device_status: 'online',
      gpu_allocated: 'Client Browser Thread',
      active_tracks: 2,
      classes: ['Person', 'Face', 'Eyes'],
      feed_url: ''
    },
    {
      id: 'CAM-102',
      name: 'North Perimeter Parking',
      rtsp_url: 'rtsp://192.168.10.51:554/stream1',
      is_active: true,
      location: 'Zone B, Lot 2',
      resolution: '1920x1080',
      fps: 75,
      bitrate: '3072 kbps',
      device_status: 'online',
      gpu_allocated: 'GPU-0 (12%)',
      active_tracks: 12,
      classes: ['Car', 'Truck', 'License Plate', 'Person'],
      feed_url: 'https://picsum.photos/seed/parking/800/450'
    },
    {
      id: 'CAM-103',
      name: 'Warehouse Loading Dock B',
      rtsp_url: 'rtsp://192.168.20.12:554/live/feed',
      is_active: true,
      location: 'Distribution Wing',
      resolution: '1280x720',
      fps: 120,
      bitrate: '2048 kbps',
      device_status: 'online',
      gpu_allocated: 'GPU-1 (6%)',
      active_tracks: 3,
      classes: ['Forklift', 'Box', 'Person', 'Truck'],
      feed_url: 'https://picsum.photos/seed/warehouse/800/450'
    },
    {
      id: 'CAM-104',
      name: 'Server Room Corridor',
      rtsp_url: 'rtsp://10.240.5.18:554/axis-media/media.amp',
      is_active: false,
      location: 'Secure Datacenter Base',
      resolution: '1920x1080',
      fps: 0,
      bitrate: '0 kbps',
      device_status: 'offline',
      gpu_allocated: 'None',
      active_tracks: 0,
      classes: ['Person'],
      feed_url: 'https://picsum.photos/seed/datacenter/800/450'
    }
  ];

  // Fetch initial cameras with hybrid FastAPI and localStorage support
  const fetchCameras = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage(null);

    // Load any custom cameras registered in localStorage
    let storedCams: CameraData[] = [];
    try {
      const stored = localStorage.getItem('vt_custom_cameras');
      if (stored) {
        storedCams = JSON.parse(stored);
      }
    } catch (e) {
      // Fail silently for localStorage issues
    }

    try {
      // Try fetching from the live FastAPI gateway (port 8000)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      
      const res = await fetch('http://127.0.0.1:8000/api/v1/cameras', {
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data)) {
          // Merge custom client-side registered cameras with backend ones
          const merged = [...data, ...storedCams];
          setCameras(merged);
          setApiSource('fastapi');
          
          if (merged.length > 0) {
            const currentSelectedId = selectedCam?.id;
            const found = merged.find(c => c.id === currentSelectedId);
            setSelectedCam(found || merged[0]);
          }
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }
    } catch (err) {
      // If FastAPI is offline or returns error, use client-side storage + default mock feeds
    }

    // Reliable Local-First Fallback
    const combined = [...DEFAULT_CAMERAS, ...storedCams];
    setCameras(combined);
    setApiSource('local_db');
    
    if (combined.length > 0) {
      const currentSelectedId = selectedCam?.id;
      const found = combined.find(c => c.id === currentSelectedId);
      setSelectedCam(found || combined[0]);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  // Initialize and update object detection frequency history (last 60 seconds)
  useEffect(() => {
    const baseCount = selectedCam ? (selectedCam.device_status === 'offline' ? 0 : selectedCam.active_tracks) : 0;
    const initialData = [];
    for (let i = 59; i >= 0; i--) {
      const randomVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      initialData.push({
        time: i,
        count: Math.max(0, baseCount + randomVariation)
      });
    }
    setDetectionHistory(initialData);
  }, [selectedCam]);

  useEffect(() => {
    if (!selectedCam || selectedCam.device_status === 'offline' || !isPlaying || streamingStatus !== 'live') {
      return;
    }

    const interval = setInterval(() => {
      setDetectionHistory(prev => {
        const currentCount = boxesRef.current ? boxesRef.current.filter(box => {
          return box.conf >= confidenceThreshold && selectedClasses.includes(box.class);
        }).length : 0;

        const next = [...prev.slice(1), { time: 0, count: currentCount }];
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedCam, isPlaying, confidenceThreshold, selectedClasses, streamingStatus]);

  // Update classes list whenever selected camera changes
  useEffect(() => {
    let bufferTimer: NodeJS.Timeout;
    if (selectedCam) {
      const classes = selectedCam.classes || ['Person', 'Car', 'Truck', 'License Plate'];
      setAllAvailableClasses(classes);
      setSelectedClasses(classes); // select all by default
      setLiveBitrate(selectedCam.bitrate);
      setLiveFps(selectedCam.fps);

      // Handle streaming status simulation
      if (selectedCam.device_status === 'offline') {
        setStreamingStatus('offline');
      } else {
        setStreamingStatus('buffering');
        bufferTimer = setTimeout(() => {
          setStreamingStatus('live');
        }, 1000); // 1000ms buffering simulation for premium feel
      }

      // Initialize unique boxes inside simulation
      const mockBoxes: BoundingBox[] = classes.map((cls, idx) => {
        const sizeW = 15 + Math.random() * 25;
        const sizeH = 25 + Math.random() * 35;
        return {
          id: `TRK-${100 + idx * 37 + Math.floor(Math.random() * 40)}`,
          class: cls,
          conf: 0.15 + Math.random() * 0.82,
          x: 10 + Math.random() * 60,
          y: 10 + Math.random() * 50,
          w: sizeW,
          h: sizeH,
          vx: (Math.random() - 0.5) * 0.7,
          vy: (Math.random() - 0.5) * 0.7
        };
      });
      boxesRef.current = mockBoxes;
    } else {
      boxesRef.current = [];
    }

    return () => {
      if (bufferTimer) clearTimeout(bufferTimer);
    };
  }, [selectedCam]);

  // Reset zoom & pan when camera changes
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [selectedCam?.id]);

  // Toast alert triggers for high-priority object detections
  useEffect(() => {
    if (!selectedCam || selectedCam.device_status === 'offline' || !isPlaying || streamingStatus !== 'live') {
      return;
    }

    const now = Date.now();

    renderBoxes.forEach(box => {
      // Track last seen timestamp
      trackPresenceRef.current[box.id] = now;

      // Check if it qualifies for high priority alert
      if (alertClasses.includes(box.class) && !alertedTracksRef.current.has(box.id)) {
        alertedTracksRef.current.add(box.id);

        const toastId = `ALARM-${Math.floor(Math.random() * 900000 + 100000)}`;
        const newToast: ToastAlert = {
          id: toastId,
          cameraName: selectedCam.name,
          className: box.class,
          conf: box.conf,
          trackId: box.id,
          timestamp: new Date().toLocaleTimeString()
        };

        setToasts(prev => [newToast, ...prev].slice(0, 4));

        // Auto dismiss toast after 5 seconds
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      }
    });

    // Garbage collect tracking states for objects not seen for > 4 seconds
    const staleDuration = 4000;
    Object.keys(trackPresenceRef.current).forEach(trackId => {
      if (now - trackPresenceRef.current[trackId] > staleDuration) {
        alertedTracksRef.current.delete(trackId);
        delete trackPresenceRef.current[trackId];
      }
    });
  }, [renderBoxes, alertClasses, selectedCam, isPlaying, streamingStatus]);

  // Webcam media stream hook
  useEffect(() => {
    if (selectedCam?.id === 'CAM-WEBCAM') {
      let activeStream: MediaStream | null = null;
      setStreamingStatus('buffering');
      
      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((stream) => {
          activeStream = stream;
          webcamStreamRef.current = stream;
          setWebcamStream(stream);
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
          }
          setStreamingStatus('live');
        })
        .catch((err) => {
          console.error("Webcam access failed:", err);
          setStreamingStatus('offline');
        });

      return () => {
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
        }
        if (webcamStreamRef.current) {
          webcamStreamRef.current.getTracks().forEach(track => track.stop());
          webcamStreamRef.current = null;
        }
        setWebcamStream(null);
      };
    }
  }, [selectedCam?.id]);

  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomIntensity = 0.15;
    let newScale = zoomScale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
    newScale = Math.max(1, Math.min(6, newScale));
    setZoomScale(newScale);
    if (newScale === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setPanOffset({ x: newX, y: newY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Handle escape key and body scroll lock for fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };

    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Real-time animation loop for tracking simulations and physical computer-vision based webcam tracking
  useEffect(() => {
    if (!isPlaying || !selectedCam || selectedCam.device_status === 'offline' || streamingStatus !== 'live') {
      setRenderBoxes([]);
      return;
    }

    let active = true;
    let frameCount = 0;
    const tick = () => {
      if (!active) return;
      frameCount++;

      const isWebcam = selectedCam.id === 'CAM-WEBCAM';
      let motionDetected = false;
      let motionCenterX = 50;
      let motionCenterY = 50;
      let motionWidth = 32;
      let motionHeight = 42;

      // Extract raw frame movement vectors from the webcam video feed
      if (isWebcam && webcamVideoRef.current && webcamVideoRef.current.readyState >= 2) {
        const video = webcamVideoRef.current;
        const canvas = motionCanvasRef.current || document.createElement('canvas');
        if (!motionCanvasRef.current) {
          canvas.width = 80;
          canvas.height = 60;
          motionCanvasRef.current = canvas;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            ctx.drawImage(video, 0, 0, 80, 60);
            const imgData = ctx.getImageData(0, 0, 80, 60);
            const data = imgData.data;

            if (prevFrameBufferRef.current) {
              const prevData = prevFrameBufferRef.current;
              let sumX = 0;
              let sumY = 0;
              let count = 0;
              let minX = 80;
              let maxX = 0;
              let minY = 60;
              let maxY = 0;

              for (let y = 0; y < 60; y++) {
                for (let x = 0; x < 80; x++) {
                  const idx = (y * 80 + x) * 4;
                  const rDiff = Math.abs(data[idx] - prevData[idx]);
                  const gDiff = Math.abs(data[idx + 1] - prevData[idx + 1]);
                  const bDiff = Math.abs(data[idx + 2] - prevData[idx + 2]);
                  const diff = rDiff + gDiff + bDiff;

                  if (diff > 42) { // Sensitivity threshold
                    sumX += x;
                    sumY += y;
                    count++;
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }

              // Filter out noise to ensure clean tracker target centering
              if (count > 20) {
                motionDetected = true;
                motionCenterX = (sumX / count / 80) * 100;
                motionCenterY = (sumY / count / 60) * 100;
                motionWidth = ((maxX - minX) / 80) * 100;
                motionHeight = ((maxY - minY) / 60) * 100;

                // Clamp to realistic bounding box proportions
                motionWidth = Math.max(25, Math.min(55, motionWidth));
                motionHeight = Math.max(30, Math.min(65, motionHeight));
              }
            }

            // Save state for next tick compare
            if (!prevFrameBufferRef.current || prevFrameBufferRef.current.length !== data.length) {
              prevFrameBufferRef.current = new Uint8ClampedArray(data);
            } else {
              prevFrameBufferRef.current.set(data);
            }
          } catch (e) {
            // Absorb security/cross-origin canvas exceptions cleanly if any
          }
        }
      }

      // Update positions: Webcams follow real-time CV movement; standard cams use high-fidelity simulated paths
      const updatedRaw = boxesRef.current.map(box => {
        if (isWebcam) {
          // Standard layout coordinates target matching
          let targetW = box.w;
          let targetH = box.h;
          let targetX = box.x;
          let targetY = box.y;

          if (box.class === 'Person') {
            targetW = motionWidth;
            targetH = motionHeight;
            targetX = motionCenterX - targetW / 2;
            targetY = motionCenterY - targetH / 2;
          } else if (box.class === 'Face') {
            targetW = motionWidth * 0.55;
            targetH = motionHeight * 0.55;
            // Face aligns above center of the physical body motion
            const faceCenterX = motionCenterX;
            const faceCenterY = motionCenterY - motionHeight * 0.12;
            targetX = faceCenterX - targetW / 2;
            targetY = faceCenterY - targetH / 2;
          } else if (box.class === 'Eyes') {
            targetW = motionWidth * 0.38;
            targetH = motionHeight * 0.18;
            // Eyes overlay is nestled in the upper tier of the face
            const faceCenterY = motionCenterY - motionHeight * 0.12;
            const eyesCenterX = motionCenterX;
            const eyesCenterY = faceCenterY - motionHeight * 0.08;
            targetX = eyesCenterX - targetW / 2;
            targetY = eyesCenterY - targetH / 2;
          }

          // Move smoothly to detected targets (faster speed when moving, steady holding when still)
          const easeSpeed = motionDetected ? 0.22 : 0.05;
          let nx = box.x + (targetX - box.x) * easeSpeed;
          let ny = box.y + (targetY - box.y) * easeSpeed;
          let nw = box.w + (targetW - box.w) * easeSpeed;
          let nh = box.h + (targetH - box.h) * easeSpeed;

          nx = Math.max(1, Math.min(99 - nw, nx));
          ny = Math.max(1, Math.min(99 - nh, ny));

          let nconf = box.conf + (Math.random() - 0.5) * 0.01;
          nconf = Math.max(0.65, Math.min(0.99, nconf));

          return {
            ...box,
            x: nx,
            y: ny,
            w: nw,
            h: nh,
            vx: 0,
            vy: 0,
            conf: nconf
          };
        } else {
          // Standard simulated pathing with random acceleration
          let driftX = (Math.random() - 0.5) * 0.08;
          let driftY = (Math.random() - 0.5) * 0.08;

          let nvx = box.vx + driftX;
          let nvy = box.vy + driftY;

          const maxSpeed = 1.2;
          nvx = Math.max(-maxSpeed, Math.min(maxSpeed, nvx));
          nvy = Math.max(-maxSpeed, Math.min(maxSpeed, nvy));

          let nx = box.x + nvx;
          let ny = box.y + nvy;

          if (nx < 5 || nx + box.w > 95) {
            nvx = -nvx;
            nx = Math.max(5, Math.min(95 - box.w, nx));
          }
          if (ny < 5 || ny + box.h > 95) {
            nvy = -nvy;
            ny = Math.max(5, Math.min(95 - box.h, ny));
          }

          let nconf = box.conf + (Math.random() - 0.5) * 0.01;
          nconf = Math.max(0.05, Math.min(0.99, nconf));

          return {
            ...box,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
            conf: nconf
          };
        }
      });

      const updated = updatedRaw.map(box => {
        if (!isKalmanEnabled) return box;

        if (!kalmanFiltersRef.current[box.id]) {
          // Use different Kalman tuning for webcam vs simulated camera
          const q = isWebcam ? 0.04 : 0.02;
          const r = isWebcam ? 1.2 : 0.4;
          kalmanFiltersRef.current[box.id] = {
            x: new KalmanFilter(box.x, q, r),
            y: new KalmanFilter(box.y, q, r),
            w: new KalmanFilter(box.w, q, r),
            h: new KalmanFilter(box.h, q, r)
          };
        }

        const filters = kalmanFiltersRef.current[box.id];
        const smoothedX = filters.x.update(box.x);
        const smoothedY = filters.y.update(box.y);
        const smoothedW = filters.w.update(box.w);
        const smoothedH = filters.h.update(box.h);

        return {
          ...box,
          x: smoothedX,
          y: smoothedY,
          w: smoothedW,
          h: smoothedH
        };
      });

      boxesRef.current = updated;

      // Filter based on confidence threshold and class selection state
      const filtered = updated.filter(box => {
        return box.conf >= confidenceThreshold && selectedClasses.includes(box.class);
      });

      setRenderBoxes(filtered);

      // ACTIVE PTZ CAMERA SENSOR FOLLOW AND AUTO-ZOOM
      if (isAutoTracking && filtered.length > 0) {
        // Find primary target (Prioritize Face/Person, fallback to any active visible track)
        const primaryTarget = filtered.find(b => b.class === 'Face') || filtered.find(b => b.class === 'Person') || filtered[0];
        
        if (primaryTarget) {
          // Calculate target physical coordinates inside video player stage
          const cx = primaryTarget.x + primaryTarget.w / 2;
          const cy = primaryTarget.y + primaryTarget.h / 2;
          
          // Offset distance from visual center (50%, 50%)
          const dx = cx - 50;
          const dy = cy - 50;

          // Ideal zoom scales dynamically based on target size (farther away targets trigger more zoom)
          const targetZoom = Math.max(1.3, Math.min(2.1, 45 / primaryTarget.h));
          setZoomScale(prev => prev + (targetZoom - prev) * 0.06);

          // Translate camera viewport sensor smoothly to align target in center
          const container = playerContainerRef.current;
          if (container) {
            const W = container.clientWidth;
            const H = container.clientHeight;
            const targetPanX = -(dx / 100) * W;
            const targetPanY = -(dy / 100) * H;

            setPanOffset(prev => ({
              x: prev.x + (targetPanX - prev.x) * 0.08,
              y: prev.y + (targetPanY - prev.y) * 0.08
            }));
          }
        }
      } else if (isAutoTracking) {
        // Return camera sensor to default unpanned/unzoomed state smoothly when no targets are found
        setZoomScale(prev => prev + (1.0 - prev) * 0.05);
        setPanOffset(prev => ({
          x: prev.x + (0 - prev.x) * 0.05,
          y: prev.y + (0 - prev.y) * 0.05
        }));
      }

      // Fluctuate telemetry indicators slightly for visual integrity
      let currentLatency = 14;
      setLiveLatency(prev => {
        const delta = (Math.random() - 0.5) * 1.5;
        currentLatency = Math.max(8, Math.min(25, Number((prev + delta).toFixed(1))));
        return currentLatency;
      });

      if (selectedCam.fps > 0) {
        setLiveFps(prev => {
          const delta = (Math.random() - 0.5) * 1.5;
          const target = selectedCam.fps < 60 ? 85 : selectedCam.fps;
          const newValue = Number((prev + delta).toFixed(1));
          return Math.max(60, Math.min(120, Math.max(target - 3, Math.min(target + 3, newValue))));
        });
      }

      setLiveGpuLoad(prev => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.max(4, Math.min(18, Number((prev + delta).toFixed(0))));
      });

      // Throttle heavy diagnostics state updates to run once every 30 frames
      if (frameCount % 30 === 0) {
        setLatencyTrend(prev => {
          const nextTrend = [...prev.slice(1), Math.round(currentLatency)];
          return nextTrend.length > 10 ? nextTrend.slice(-10) : nextTrend;
        });

        setLiveCpuLoad(prev => {
          const delta = (Math.random() - 0.5) * 3;
          return Math.max(10, Math.min(35, Number((prev + delta).toFixed(1))));
        });

        setEdgeTemp(prev => {
          const delta = (Math.random() - 0.5) * 0.8;
          return Math.max(42.0, Math.min(58.0, Number((prev + delta).toFixed(1))));
        });

        setLiveVramUsage(prev => {
          const delta = (Math.random() - 0.5) * 0.04;
          return Math.max(1.8, Math.min(3.2, Number((prev + delta).toFixed(2))));
        });

        setLiveRamUsage(prev => {
          const delta = (Math.random() - 0.5) * 6;
          return Math.max(280.0, Math.min(420.0, Number((prev + delta).toFixed(1))));
        });
      }

      // Simulate occasional frame drops under normal rendering (0.3% chance per frame)
      if (Math.random() < 0.003) {
        setFrameDropCount(prev => prev + 1);
      }

      requestAnimationFrame(tick);
    };

    const animFrame = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, selectedCam, confidenceThreshold, selectedClasses, streamingStatus, isAutoTracking, isKalmanEnabled]);

  // Toggle dynamic class filtering
  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Capture current camera overlay state as snapshot log and save as file
  const handleCaptureSnapshot = () => {
    if (!selectedCam || selectedCam.device_status === 'offline') return;

    setIsSnapshotFlash(true);
    setTimeout(() => setIsSnapshotFlash(false), 200);

    const timestamp = new Date().toLocaleTimeString();
    const dateStr = new Date().toISOString().slice(0, 10);
    const timeClean = timestamp.replace(/:/g, '-').replace(/\s+/g, '_');
    const filename = `${selectedCam.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${dateStr}_${timeClean}.png`;

    const isWebcam = selectedCam.id === 'CAM-WEBCAM';
    const mediaElement = isWebcam ? webcamVideoRef.current : imageRef.current;
    if (mediaElement) {
      const canvas = document.createElement('canvas');
      const width = isWebcam 
        ? (mediaElement as HTMLVideoElement).videoWidth || 1280 
        : (mediaElement as HTMLImageElement).naturalWidth || 1280;
      const height = isWebcam 
        ? (mediaElement as HTMLVideoElement).videoHeight || 720 
        : (mediaElement as HTMLImageElement).naturalHeight || 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          // Draw the background feed image or video frame
          ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);

          // Draw active bounding boxes overlay onto the captured image if showOverlays is active
          if (showOverlays && isPlaying && streamingStatus === 'live') {
            renderBoxes.forEach(box => {
              const boxColor = CLASS_COLORS[box.class] || '#3b82f6';
              // Convert percentage-based coordinates to actual canvas pixels
              const x = (box.x / 100) * canvas.width;
              const y = (box.y / 100) * canvas.height;
              const w = (box.w / 100) * canvas.width;
              const h = (box.h / 100) * canvas.height;

              // Draw border
              ctx.strokeStyle = boxColor;
              ctx.lineWidth = Math.max(3, Math.round(canvas.width / 400));
              ctx.strokeRect(x, y, w, h);

              // Draw tag/label background
              ctx.fillStyle = boxColor;
              const text = `${box.class} ${(box.conf * 100).toFixed(0)}%`;
              const fontSize = Math.max(12, Math.round(canvas.width / 80));
              ctx.font = `bold ${fontSize}px monospace`;
              const textWidth = ctx.measureText(text).width;
              const padding = fontSize * 0.4;
              ctx.fillRect(x - 1, y - (fontSize + padding), textWidth + padding * 2, fontSize + padding);

              // Draw label text
              ctx.fillStyle = '#ffffff';
              ctx.fillText(text, x + padding, y - padding * 0.7);
            });
          }

          // Convert to dataURL and trigger download
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error('Snapshot capture CORS or general exception:', error);
          if (!isWebcam) {
            // Fallback to direct download of the unmodified feed image
            const link = document.createElement('a');
            link.href = selectedCam.feed_url;
            link.target = '_blank';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }
    }

    const snapId = `SNAP-${selectedCam.id}-${Math.floor(Math.random() * 1000)}`;
    const desc = `${selectedCam.name} snapshot saved locally as '${filename}' with ${renderBoxes.length} active tracks.`;
    
    setSnapshots(prev => [`[${timestamp}] ${snapId}: ${desc}`, ...prev.slice(0, 7)]);
  };

  // Submit and register a new camera with local and optional API support
  const handleAddCameraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!newCamName.trim()) {
      setFormError('Camera label is required');
      setIsSubmitting(false);
      return;
    }

    if (!newCamRtsp.trim() || !newCamRtsp.startsWith('rtsp://')) {
      setFormError('RTSP Stream location must be non-empty and start with rtsp://');
      setIsSubmitting(false);
      return;
    }

    // Build the camera payload
    const newCameraPayload = {
      name: newCamName,
      rtsp_url: newCamRtsp,
      location: newCamLocation || 'Facility Perimeter',
      classes: newCamClasses,
      is_active: true
    };

    let registeredOnBackend = false;

    // Optional: Attempt registering to FastAPI
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCameraPayload),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (response.ok) {
        registeredOnBackend = true;
      }
    } catch (err) {
      // Fallback silently to client-side localStorage
    }

    // Always register in client-side localStorage to ensure persistence across sessions
    const newCameraLocal: CameraData = {
      id: 'CAM-' + Math.floor(Math.random() * 900 + 100),
      name: newCamName,
      rtsp_url: newCamRtsp,
      is_active: true,
      location: newCamLocation || 'Facility Perimeter',
      resolution: '1920x1080',
      fps: 30,
      bitrate: '3584 kbps',
      device_status: 'online',
      gpu_allocated: 'GPU-0 (5%)',
      active_tracks: 0,
      classes: newCamClasses,
      feed_url: 'https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/800/450'
    };

    try {
      const stored = localStorage.getItem('vt_custom_cameras');
      const storedList = stored ? JSON.parse(stored) : [];
      storedList.push(newCameraLocal);
      localStorage.setItem('vt_custom_cameras', JSON.stringify(storedList));
    } catch (e) {
      // Fail silently
    }

    await fetchCameras(true);
    setIsAddModalOpen(false);

    // Reset Form fields
    setNewCamName('');
    setNewCamRtsp('rtsp://192.168.1.100:554/live');
    setNewCamLocation('');
    setIsSubmitting(false);
  };

  const handleSelectAllClasses = () => {
    setSelectedClasses(allAvailableClasses);
  };

  const handleClearAllClasses = () => {
    setSelectedClasses([]);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (eventLog.length === 0) return;
    const csvContent = [
      ['Timestamp', 'Camera ID', 'Camera Name', 'Detected Class', 'Confidence %', 'Track ID'],
      ...eventLog.map(e => [e.timestamp, e.cameraId, e.cameraName, e.className, `${e.confidence}%`, e.trackId])
    ].map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `visiontrack_analytics_${selectedCam?.id || 'all'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export handler
  const handleExportJSON = () => {
    if (eventLog.length === 0) return;
    const blob = new Blob([JSON.stringify(eventLog, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `visiontrack_analytics_${selectedCam?.id || 'all'}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans" id="CameraStream">
      
      {/* ENTERPRISE LOGISTICS HEADER & ACCELERATED COMMAND BAR */}
      <header className="border-b border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-950/40 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm z-40 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-md shadow-blue-500/10">
            <Camera className="text-white animate-pulse" size={18} />
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping pointer-events-none scale-150"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans flex items-center gap-2">
                VisionTrack AI
                <span className="text-xs font-mono font-normal text-slate-400 dark:text-slate-500 hidden md:inline">v3.5</span>
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                CORE ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise Intelligent Camera Stream Analytics Dashboard</p>
          </div>
        </div>

        {/* QUICK COMMAND BAR */}
        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          {/* CSV export */}
          <button
            onClick={handleExportCSV}
            disabled={eventLog.length === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] font-bold tracking-wide transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export accumulated session event logs to CSV format"
          >
            <FileSpreadsheet size={13} className="text-emerald-500 dark:text-emerald-400" />
            <span>EXPORT CSV</span>
          </button>

          {/* JSON export */}
          <button
            onClick={handleExportJSON}
            disabled={eventLog.length === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-mono text-[11px] font-bold tracking-wide transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export accumulated session event logs to JSON format"
          >
            <FileJson size={13} className="text-blue-500 dark:text-blue-400" />
            <span>EXPORT JSON</span>
          </button>

          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          {/* Theme Switch Button */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
            title={isDark ? "Switch to Editorial Light Mode" : "Switch to Surveillance Dark Mode"}
          >
            {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTAINER GRID */}
      <div className="flex-1 w-full p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6" id="dashboard_grid_wrapper">
        
        {/* COLUMN 1: STREAMS NAVIGATION LIST (4 Cols) */}
        <div className="col-span-12 md:col-span-4 border border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-900/30 backdrop-blur rounded-2xl flex flex-col h-[520px] md:h-[650px] overflow-hidden shadow-sm transition-all duration-300" id="camera_sidebar_section">
        {/* Header with active actions */}
        <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-950/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <Camera className="text-blue-500 animate-pulse" size={18} />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">RTSP Stream Manager</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchCameras(true)}
              className="p-1.5 rounded-md hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Refresh camera sources"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="p-1.5 rounded-md bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer"
              title="Register physical stream"
            >
              <Plus size={13} />
              <span>ADD</span>
            </button>
          </div>
        </div>

        {/* API Integration Source Info Panel */}
        <div className="px-4 py-2 border-b border-slate-900 bg-slate-900/15 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Gateway State: <strong className="text-slate-400">REST ACTIVE</strong></span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] uppercase">
            Src: {apiSource}
          </span>
        </div>

        {/* Channels scroll container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scroll">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 py-10">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
              <span className="text-xs font-mono">Syncing gateway streaming registries...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-center space-y-3 my-4">
              <AlertTriangle className="text-rose-500 mx-auto" size={24} />
              <p className="text-xs text-rose-400 font-mono leading-relaxed">{errorMessage}</p>
              <button 
                onClick={() => fetchCameras()}
                className="w-full py-1.5 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-mono text-[11px] transition-all cursor-pointer"
              >
                Retry API Connection
              </button>
            </div>
          ) : cameras.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500 py-12">
              <Monitor className="text-slate-700" size={32} />
              <div>
                <p className="text-xs font-bold text-slate-300">No Active Cameras</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1">Register your local IP camera rtsp:// network feeds to initiate processing.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-slate-100 font-mono text-[11px] transition-all cursor-pointer"
              >
                Register First Camera
              </button>
            </div>
          ) : (
            cameras.map(cam => {
              const isActiveAndSelected = selectedCam?.id === cam.id;
              const isOffline = cam.device_status === 'offline';
              return (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCam(cam)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 group relative overflow-hidden ${
                    isActiveAndSelected
                      ? 'bg-blue-950/20 border-blue-500/40 shadow-md shadow-blue-950/40'
                      : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 z-10">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                        {cam.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono leading-tight truncate max-w-[200px]" title={cam.rtsp_url}>
                        {cam.rtsp_url}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono border uppercase tracking-wider ${
                      isOffline 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : cam.is_active 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {isOffline ? 'Offline' : cam.is_active ? 'Active' : 'Standby'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 z-10">
                    <span className="flex items-center gap-1">
                      <Cpu size={11} className="text-slate-600" />
                      {cam.gpu_allocated === 'None' ? 'Idle' : cam.gpu_allocated}
                    </span>
                    <span>{cam.resolution}</span>
                  </div>

                  {/* Left accent hover indicator */}
                  {isActiveAndSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom hardware state preview widget */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-col gap-3" id="camera_hardware_telemetry">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Host Node Resources</span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-900 space-y-1">
              <span className="text-slate-500 block text-[9px] uppercase">Accelerator Load</span>
              <span className="text-slate-200 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                Tesla T4: {liveGpuLoad}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-900 space-y-1">
              <span className="text-slate-500 block text-[9px] uppercase">Codec Latency</span>
              <span className="text-slate-200 font-bold">
                {selectedCam && selectedCam.device_status !== 'offline' ? `${liveLatency} ms` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: PRIMARY PLAYER SCREEN AND METADATA PANEL (8 Cols) */}
      <div className="col-span-12 md:col-span-8 flex flex-col gap-6" id="camera_viewport_section">
        
        {/* VIEWPORT CARD PANEL */}
        <div className="border border-slate-200/80 dark:border-slate-900 bg-white dark:bg-slate-900/30 backdrop-blur rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-300">
          
          {selectedCam ? (
            <>
              {/* Viewport Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/80 backdrop-blur z-10">
                <div>
                  <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold block">Active Channel Viewport</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {selectedCam.name}
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-normal">({selectedCam.location})</span>
                  </h3>
                </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-mono">
                  {streamingStatus === 'live' ? (
                    <>
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">LIVE CONNECTED</span>
                    </>
                  ) : streamingStatus === 'buffering' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
                      <span className="text-amber-500 font-bold uppercase">BUFFERING FEED</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="text-rose-500 dark:text-rose-400 font-bold uppercase">OFFLINE</span>
                    </>
                  )}
                </span>

                {selectedCam.device_status !== 'offline' && (
                  <>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1"></div>

                    {/* On/Off Toggle Switch */}
                    <div className="flex items-center gap-2 pl-1 select-none">
                      <button
                        onClick={() => {
                          setIsPlaying(!isPlaying);
                          if (!isPlaying && selectedCam.device_status !== 'offline') {
                            setStreamingStatus('buffering');
                            setTimeout(() => setStreamingStatus('live'), 600);
                          }
                        }}
                        className={`relative w-9 h-5 rounded-full transition-all duration-300 cursor-pointer flex items-center outline-none ${
                          isPlaying ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-inner' : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800'
                        }`}
                        title={isPlaying ? 'Turn Off Stream Feed' : 'Turn On Stream Feed'}
                        id="viewport_feed_on_off_toggle"
                      >
                        <motion.div 
                          className={`w-3.5 h-3.5 rounded-full shadow flex items-center justify-center ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}
                          animate={{ x: isPlaying ? 16 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <Power size={7} className="text-white font-extrabold" />
                        </motion.div>
                      </button>
                    </div>
                  </>
                )}

                {isFullScreen && (
                  <button 
                    onClick={() => setIsFullScreen(false)}
                    className="p-1.5 ml-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
                    title="Exit Full Screen (Esc)"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Video Canvas Visualizer Stage */}
            <div 
              className="relative overflow-hidden flex items-center justify-center bg-slate-950 select-none h-[380px] md:h-[420px] shadow-inner cursor-grab active:cursor-grabbing" 
              ref={playerContainerRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              
              {/* Snapshot flash screen */}
              {isSnapshotFlash && (
                <div className="absolute inset-0 bg-white z-50 animate-fade-out" style={{ animationDuration: '200ms' }}></div>
              )}

              {/* ZOOM STAGE WRAPPER */}
              <div 
                className="w-full h-full transition-transform duration-75 ease-out select-none pointer-events-none"
                style={{
                  transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  transformOrigin: 'center center'
                }}
              >
                {/* Feed Image and Overlays */}
                {selectedCam.device_status === 'offline' || streamingStatus === 'offline' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-3 text-slate-500 p-8">
                    <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
                      <WifiOff size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-300">{selectedCam.id === 'CAM-WEBCAM' ? 'Camera Access Blocked' : 'RTSP Stream Unavailable'}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-mono max-w-xs">
                      RTSP network stream returned zero keyframes. Validate authorization tokens or physical camera gateway server power.
                    </p>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                    {selectedCam.id === 'CAM-WEBCAM' ? (
                      <video
                        ref={webcamVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-all ${isPlaying && streamingStatus === 'live' ? 'brightness-[0.9] contrast-[1.05]' : 'brightness-[0.3] filter blur-sm grayscale'}`}
                      />
                    ) : (
                      <img
                        ref={imageRef}
                        src={selectedCam.feed_url}
                        alt={selectedCam.name}
                        crossOrigin="anonymous"
                        className={`w-full h-full object-cover transition-all ${isPlaying && streamingStatus === 'live' ? 'brightness-[0.9] contrast-[1.05]' : 'brightness-[0.3] filter blur-sm grayscale'}`}
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Absolute Simulated Bounding Box Overlay Stage */}
                    {showOverlays && isPlaying && streamingStatus === 'live' && (
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        {renderBoxes.map(box => {
                          const boxColor = CLASS_COLORS[box.class] || '#3b82f6';
                          const isNearTop = box.y < 5;
                          return (
                            <div
                              key={box.id}
                              className="absolute border border-dashed transition-[border-color,box-shadow] duration-200 flex flex-col justify-start"
                              style={{
                                borderColor: `${boxColor}bb`,
                                left: `${box.x}%`,
                                top: `${box.y}%`,
                                width: `${box.w}%`,
                                height: `${box.h}%`,
                                boxShadow: `0 0 16px ${boxColor}1a`
                              }}
                            >
                              {/* HUD Corner Brackets */}
                              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: boxColor }} />
                              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: boxColor }} />
                              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: boxColor }} />
                              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: boxColor }} />

                              {/* Box Tag/Label */}
                              <div 
                                className={`absolute left-[-1px] px-2 py-0.5 text-[9px] font-mono font-bold text-white flex items-center gap-1.5 select-none pointer-events-auto rounded shadow-md border border-white/10 ${
                                  isNearTop ? 'top-0 rounded-t-none border-t-0' : '-top-[20px]'
                                }`}
                                style={{ backgroundColor: boxColor }}
                              >
                                {(() => {
                                  const IconComponent = CLASS_ICONS[box.class] || Info;
                                  return <IconComponent size={9} className="shrink-0" />;
                                })()}
                                <span className="tracking-wide uppercase text-[8px]">{box.class}</span>
                                <span className="bg-black/30 px-1 py-0.2 rounded text-[7px] font-bold text-white/95 leading-none">
                                  {(box.conf * 100).toFixed(0)}%
                                </span>
                                <span className="text-[7px] opacity-75 font-normal scale-90">
                                  {box.id}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FLOATING CORNER INTERACTIVE TARGET COUNTS LIST OVERLAY */}
              {isPlaying && streamingStatus === 'live' && renderBoxes.length > 0 && (
                <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl z-30 shadow-xl flex flex-col gap-1.5 pointer-events-none select-none max-w-[150px]">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1 mb-0.5">
                    <CircleDot className="text-emerald-500 animate-pulse" size={10} />
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-slate-400">HUD Targets</span>
                  </div>
                  {Object.entries(
                    renderBoxes.reduce((acc, b) => {
                      acc[b.class] = (acc[b.class] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([cls, count]) => {
                    const clsColor = CLASS_COLORS[cls] || '#3b82f6';
                    return (
                      <div key={cls} className="flex items-center justify-between gap-3 text-[9px] font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: clsColor }}></span>
                          {cls}
                        </span>
                        <span className="font-bold text-white px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interactive Dynamic Zoom Level Badge Overlay */}
              {zoomScale > 1 && (
                <div className="absolute top-12 left-3 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800/80 backdrop-blur-md text-[10px] font-mono text-blue-400 z-30 flex items-center gap-2 shadow-xl animate-fade-in">
                  <span className="font-bold text-sky-400">ZOOM: {zoomScale.toFixed(2)}x</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-[9px] text-slate-300">Scroll to Zoom / Drag to Pan</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomScale(1);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[8px] transition-all cursor-pointer"
                  >
                    RESET
                  </button>
                </div>
              )}

              {/* Buffering overlay spinner */}
              {streamingStatus === 'buffering' && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-30">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/10 border-t-2 border-t-blue-500 animate-spin"></div>
                    <div className="absolute w-8 h-8 rounded-full border-2 border-cyan-500/10 border-b-2 border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-bold text-blue-400 animate-pulse uppercase tracking-wider">CONNECTING STREAM</span>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">Acquiring keyframes and buffering sockets...</span>
                  </div>
                </div>
              )}

              {/* Stream Pause Cover Grid */}
              {!isPlaying && streamingStatus === 'live' && (
                <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center gap-2 z-30">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Pause size={18} />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400">ANALYSIS PAUSED</span>
                  <p className="text-[10px] text-slate-500 font-mono">Stream analytics core freeze active.</p>
                </div>
              )}

              {/* Visual Status Tag in top-right */}
              <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg backdrop-blur-md border text-[9px] font-mono font-bold uppercase tracking-wider z-30 flex items-center gap-1.5 transition-all shadow-lg ${
                streamingStatus === 'live'
                  ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20'
                  : streamingStatus === 'buffering'
                  ? 'bg-amber-950/85 border-amber-500/30 text-amber-400 shadow-amber-950/20'
                  : 'bg-rose-950/85 border-rose-500/30 text-rose-400 shadow-rose-950/20'
              }`}>
                {streamingStatus === 'live' ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>LIVE FEED</span>
                  </>
                ) : streamingStatus === 'buffering' ? (
                  <>
                    <RefreshCw size={10} className="animate-spin text-amber-400" />
                    <span>CONNECTING</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>OFFLINE</span>
                  </>
                )}
              </div>

                {/* Toast Alert Notifications Overlays Container */}
                <div className="absolute top-16 right-3 z-40 flex flex-col gap-2 max-w-[240px] w-full" id="toasts_overlay_container">
                  <AnimatePresence>
                    {toasts.map(toast => (
                      <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="p-2.5 rounded-xl bg-slate-950/95 border border-amber-500/30 border-l-4 border-l-amber-500 shadow-xl backdrop-blur-md flex gap-2 relative overflow-hidden"
                        id={`toast_${toast.id}`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                          <ShieldAlert size={12} />
                        </div>
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] font-mono font-bold text-amber-400 uppercase tracking-wider">AI Alarm</span>
                            <span className="text-[8px] font-mono text-slate-500 shrink-0">{toast.timestamp}</span>
                          </div>
                          <h5 className="text-[10px] font-bold text-slate-100 mt-0.5 leading-snug truncate">
                            {toast.className} Detected
                          </h5>
                          <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                            Conf: <span className="text-amber-400 font-bold">{(toast.conf * 100).toFixed(0)}%</span> &bull; {toast.trackId}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setToasts(prev => prev.filter(t => t.id !== toast.id));
                          }}
                          className="absolute top-1 right-1 p-0.5 rounded hover:bg-slate-900 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Unified Absolute-Positioned VMS Control Bar Overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md border-t border-slate-900/80 px-4 py-2 z-30 flex items-center justify-between text-[10px] font-mono text-slate-300 shadow-lg" id="camera_video_vms_control_bar">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(!isPlaying);
                        if (!isPlaying && selectedCam.device_status !== 'offline') {
                          setStreamingStatus('buffering');
                          setTimeout(() => setStreamingStatus('live'), 600);
                        }
                      }}
                      className="p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-bold"
                      title={isPlaying ? 'Pause stream' : 'Resume stream'}
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} className="text-emerald-400" />}
                      <span className="text-[9px] tracking-wider">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCaptureSnapshot();
                      }}
                      className="p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-bold"
                      title="Save current frame as timestamped local image file"
                    >
                      <Camera size={12} className="text-sky-400" />
                      <span className="text-[9px] tracking-wider">SNAP</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOverlays(!showOverlays);
                      }}
                      className="p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-bold"
                      title={showOverlays ? 'Hide overlays' : 'Show overlays'}
                    >
                      <Layers size={12} className={showOverlays ? 'text-blue-400' : 'text-slate-400'} />
                      <span className="text-[9px] tracking-wider">{showOverlays ? 'HUD ON' : 'HUD OFF'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoTracking(!isAutoTracking);
                      }}
                      className={`p-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                        isAutoTracking 
                          ? 'bg-amber-950/45 border-amber-500/55 text-amber-400 hover:border-amber-400 hover:bg-amber-950/60' 
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                      }`}
                      title={isAutoTracking ? 'Disable Active PTZ Sensor Auto-Tracking' : 'Enable Active PTZ Sensor Auto-Tracking'}
                    >
                      <Scan size={12} className={isAutoTracking ? 'text-amber-400 animate-pulse' : 'text-slate-400'} />
                      <span className="text-[9px] tracking-wider">{isAutoTracking ? 'PTZ ACTIVE' : 'PTZ MANUAL'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsKalmanEnabled(!isKalmanEnabled);
                      }}
                      className={`p-1.5 rounded-md border transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                        isKalmanEnabled 
                          ? 'bg-emerald-950/45 border-emerald-500/55 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/60' 
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                      }`}
                      title={isKalmanEnabled ? 'Disable Kalman Filter Smoothing' : 'Enable Kalman Filter Smoothing'}
                    >
                      <Sparkles size={12} className={isKalmanEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} />
                      <span className="text-[9px] tracking-wider">{isKalmanEnabled ? 'KALMAN ACTIVE' : 'KALMAN OFF'}</span>
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 bg-slate-900/40 px-2.5 py-1 rounded-md border border-slate-900/60 text-[10px]">
                    <div className="flex items-center gap-1">
                      <Activity className="text-emerald-400 shrink-0" size={11} />
                      <span className="text-emerald-400 font-bold">{selectedCam && streamingStatus === 'live' && isPlaying ? `${Number(liveFps).toFixed(1)} FPS` : '0.0 FPS'}</span>
                    </div>
                    <div className="h-2 w-[1px] bg-slate-800"></div>
                    <div className="flex items-center gap-1">
                      <SlidersHorizontal className="text-amber-400 shrink-0" size={11} />
                      <span className="text-amber-400 font-bold">{selectedCam && streamingStatus === 'live' && isPlaying ? `${liveLatency} ms` : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFullScreen(!isFullScreen);
                      }}
                      className="p-1.5 rounded-md bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                    >
                      {isFullScreen ? <Minimize2 size={12} className="text-blue-400" /> : <Maximize2 size={12} />}
                      <span className="text-[9px] font-bold tracking-wider">{isFullScreen ? 'EXIT' : 'FULL'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Viewport Control Sliders and Config panels */}
              {selectedCam.device_status !== 'offline' && (
                <div className="p-3.5 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/60 flex flex-col md:flex-row justify-between gap-4 text-[11px] font-mono">
                  
                  {/* Simulate streams controllers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Simulate:</span>
                    <div className="flex items-center bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-1 rounded-lg shadow-sm">
                      <button
                        onClick={() => setStreamingStatus('live')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          streamingStatus === 'live'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        LIVE
                      </button>
                      <button
                        onClick={() => setStreamingStatus('buffering')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          streamingStatus === 'buffering'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        BUFFER
                      </button>
                      <button
                        onClick={() => setStreamingStatus('offline')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          streamingStatus === 'offline'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        OFFLINE
                      </button>
                    </div>
                  </div>

                  {/* Calibration Sliders */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/60 px-2.5 py-1 rounded-lg shadow-sm">
                      <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-bold">Conf:</span>
                      <input 
                        type="range" 
                        min="0.00" 
                        max="1.00" 
                        step="0.01"
                        value={confidenceThreshold}
                        onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-blue-600 dark:text-blue-400 font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/60 px-2.5 py-1 rounded-lg shadow-sm">
                      <span className="text-slate-400 dark:text-slate-500 text-[9px] uppercase font-bold">IoU:</span>
                      <input 
                        type="range" 
                        min="0.05" 
                        max="1.00" 
                        step="0.01"
                        value={iouThreshold}
                        onChange={(e) => setIouThreshold(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-slate-200 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">{(iouThreshold * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                </div>
              )}
              {/* FOUR-COLUMN COMPREHENSIVE DASHBOARD METADATA & CONTROL PANEL */}
              {selectedCam.device_status !== 'offline' && (
                <div className="p-4 border-t border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-950/40 grid grid-cols-1 md:grid-cols-12 gap-5 text-xs font-mono">
                  
                  {/* BLOCK A: Class Overrides and Toggle switches (3 Cols) */}
                  <div className="md:col-span-3 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter size={11} className="text-slate-400 dark:text-slate-500" />
                        Class Filters
                      </span>
                      <div className="flex gap-2 text-[8px] font-bold">
                        <button onClick={handleSelectAllClasses} className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">ALL</button>
                        <span className="text-slate-300 dark:text-slate-800">|</span>
                        <button onClick={handleClearAllClasses} className="text-slate-400 dark:text-slate-500 hover:underline cursor-pointer">CLEAR</button>
                      </div>
                    </div>
                    
                    <div className="h-36 overflow-y-auto space-y-1.5 pr-1 custom-scroll">
                      {allAvailableClasses.map(cls => {
                        const isSelected = selectedClasses.includes(cls);
                        const clsColor = CLASS_COLORS[cls] || '#3b82f6';
                        const isAlertActive = alertClasses.includes(cls);
                        return (
                          <div
                            key={cls}
                            className={`rounded-lg border transition-all flex items-center justify-between overflow-hidden h-[26px] ${
                              isSelected 
                                ? 'bg-slate-50/50 dark:bg-slate-900/30' 
                                : 'bg-slate-50/10 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-600'
                            }`}
                            style={{ 
                              borderColor: isSelected ? `${clsColor}44` : undefined,
                            }}
                          >
                            <button
                              onClick={() => toggleClass(cls)}
                              className="flex-1 px-2.5 h-full text-[10px] font-mono flex items-center gap-1.5 cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-900/20"
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: clsColor }}></span>
                              <span className={isSelected ? 'text-slate-700 dark:text-slate-200 font-bold' : 'text-slate-400 dark:text-slate-600'}>{cls}</span>
                              {isSelected && <Check size={10} className="text-slate-400 dark:text-slate-300 shrink-0 ml-auto" />}
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAlertClasses(prev =>
                                  prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
                                );
                              }}
                              className={`px-2 h-full border-l border-slate-100 dark:border-slate-900 flex items-center justify-center transition-all cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/50 ${
                                isAlertActive ? 'text-amber-500 dark:text-amber-400 bg-amber-500/5' : 'text-slate-300 dark:text-slate-700 hover:text-slate-400'
                              }`}
                              title={isAlertActive ? 'Disable priority alarm toasts' : 'Enable priority alarm toasts'}
                            >
                              {isAlertActive ? <Bell size={10} className="fill-amber-400/10" /> : <BellOff size={10} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BLOCK B: REAL-TIME FRAME TARGETS COUNTS WIDGET (3 Cols) */}
                  <div className="md:col-span-3 space-y-3 md:border-l border-slate-100 dark:border-slate-900/80 md:pl-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CircleDot size={11} className="text-emerald-500 shrink-0 animate-pulse" />
                        In-Frame Targets
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 rounded font-bold uppercase">
                        {isPlaying && streamingStatus === 'live' ? 'ACTIVE' : 'STANDBY'}
                      </span>
                    </div>

                    <div className="h-36 overflow-y-auto space-y-2 pr-1 custom-scroll flex flex-col justify-center">
                      {!isPlaying || streamingStatus !== 'live' ? (
                        <div className="text-center text-slate-400 dark:text-slate-600 text-[10px] italic py-6">
                          Connect stream feed to activate real-time frame telemetry parsing.
                        </div>
                      ) : renderBoxes.length === 0 ? (
                        <div className="text-center py-6 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-600">
                          <div className="w-6 h-6 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center animate-spin">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          </div>
                          <span className="text-[9px] tracking-wider uppercase font-bold animate-pulse text-blue-500 dark:text-blue-400">Radar Sweeping...</span>
                          <span className="text-[8px] text-slate-400 dark:text-slate-500">No matching targets in frame range.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(
                            renderBoxes.reduce((acc, box) => {
                              acc[box.class] = (acc[box.class] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([cls, count]) => {
                            const clsColor = CLASS_COLORS[cls] || '#3b82f6';
                            const maxLimit = selectedCam.active_tracks > 0 ? selectedCam.active_tracks : 10;
                            const proportion = Math.min(100, Math.round((count / maxLimit) * 100));
                            return (
                              <div key={cls} className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: clsColor }}></span>
                                    {cls} Detected
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                    {count} {count === 1 ? 'unit' : 'units'}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-900">
                                  <div 
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ 
                                      backgroundColor: clsColor,
                                      width: `${proportion}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BLOCK C: LIVE METADATA CONSOLE TERMINAL (3 Cols) */}
                  <div className="md:col-span-3 space-y-3 md:border-l border-slate-100 dark:border-slate-900/80 md:pl-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal size={11} className="text-slate-400 dark:text-slate-500" />
                        Surveillance Event Log
                      </span>
                      <div className="flex gap-1.5 text-[8px] font-bold">
                        <button 
                          onClick={() => setEventLog([])}
                          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors uppercase cursor-pointer"
                          title="Clear current log list"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="h-36 overflow-y-auto bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-900 rounded-xl p-2.5 space-y-1.5 text-[9px] font-mono text-slate-600 dark:text-slate-400 custom-scroll shadow-inner">
                      {eventLog.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-center italic text-[9px]">
                          Waiting for stream targets tracking to initiate logging...
                        </div>
                      ) : (
                        eventLog.map((evt) => (
                          <div key={evt.id} className="pb-1 border-b border-slate-100 dark:border-slate-900 last:border-b-0 hover:text-slate-900 dark:hover:text-slate-200 leading-normal font-mono text-[9px] flex flex-wrap items-start justify-between gap-1">
                            <div>
                              <span className="text-blue-500 dark:text-blue-400">[{evt.timestamp}]</span>{' '}
                              <strong className="text-slate-700 dark:text-slate-300">{evt.className}</strong>{' '}
                              <span className="opacity-75">({evt.trackId})</span>
                            </div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">{evt.confidence}%</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* BLOCK D: EDGE AI STREAM DIAGNOSTICS (3 Cols) */}
                  <div className="md:col-span-3 space-y-3 md:border-l border-slate-100 dark:border-slate-900/80 md:pl-4" id="edge_ai_diagnostics_panel">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-900/80">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={11} className="text-blue-500 shrink-0" />
                        Edge Diagnostics
                      </span>
                      <button 
                        onClick={() => setFrameDropCount(0)}
                        className="text-[8px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:underline cursor-pointer uppercase"
                        title="Reset Frame Drops Counter"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="space-y-2 text-[10px]">
                      {/* Health Indicator */}
                      <div className="flex items-center justify-between p-1 px-1.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-900/60 rounded-lg">
                        <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold text-[8px]">Processor Status</span>
                        <div className="flex items-center gap-1 font-bold text-[9px]">
                          {streamingStatus === 'live' && frameDropCount < 50 ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-emerald-500">OPTIMAL</span>
                            </>
                          ) : streamingStatus === 'live' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span className="text-amber-500">STABLE (JITTER)</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span className="text-rose-500">DEGRADED</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Frame Drops */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold text-[8px]">Frame Drops</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded border text-[9px] ${
                          frameDropCount === 0
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
                            : frameDropCount < 20
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/20 animate-pulse'
                            : 'text-rose-600 dark:text-rose-400 bg-rose-500/5 border-rose-500/20 font-extrabold animate-pulse'
                        }`}>
                          {frameDropCount} frames
                        </span>
                      </div>

                      {/* GPU Loading with bar */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold text-[8px]">GPU Load / VRAM</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            {liveGpuLoad}% &bull; {liveVramUsage.toFixed(2)} GB
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-900 flex">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${liveGpuLoad}%` }}
                          ></div>
                          <div 
                            className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                            style={{ width: `${(liveVramUsage / 4.0) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* CPU Loading with bar */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold text-[8px]">CPU Load / RAM</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            {liveCpuLoad.toFixed(1)}% &bull; {Math.round(liveRamUsage)} MB
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-900 flex">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                            style={{ width: `${liveCpuLoad}%` }}
                          ></div>
                          <div 
                            className="h-full bg-teal-400 rounded-full transition-all duration-300"
                            style={{ width: `${(liveRamUsage / 1024) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Temp & Real-time Latency Trend sparkline */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold text-[8px] leading-none">Core Temp</span>
                          <span className={`text-[10px] font-bold mt-1 ${
                            edgeTemp < 52 ? 'text-slate-700 dark:text-slate-300' :
                            edgeTemp < 56 ? 'text-amber-500' : 'text-rose-500 font-extrabold'
                          }`}>
                            {edgeTemp.toFixed(1)}°C
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400 dark:text-slate-500 uppercase font-semibold text-[8px] leading-none">Latency (10s)</span>
                          <div className="flex items-end gap-0.5 h-5 mt-1">
                            {latencyTrend.map((lat, idx) => {
                              const heightPct = Math.max(15, Math.min(100, Math.round((lat / 25) * 100)));
                              return (
                                <div 
                                  key={idx}
                                  className="w-[2.5px] bg-blue-500/70 hover:bg-blue-400 rounded-t transition-all"
                                  style={{ height: `${heightPct}%` }}
                                  title={`Latency: ${lat}ms`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 text-slate-400 dark:text-slate-500 min-h-[450px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-2 shadow-sm animate-pulse">
                <Camera className="text-slate-400 dark:text-slate-600" size={32} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Active Stream Feed</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm leading-relaxed">
                Connect and select any of the registered cameras on the RTSP registry panel to initialize live vision tracking and analytics.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* FULL-WIDTH DIAGNOSTIC METADATA OVERLAY PANEL */}
      <div className="col-span-12 border border-slate-150 dark:border-slate-900 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md p-4 flex flex-col xl:flex-row items-center justify-between gap-4 text-xs font-mono select-none rounded-2xl shadow-sm" id="camera_stream_metadata_panel">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase text-[10px]">DIAGNOSTIC STATUS:</span>
          </div>
          {selectedCam ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-250 dark:border-slate-800">{selectedCam.name}</span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">({selectedCam.location})</span>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                streamingStatus === 'live' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                streamingStatus === 'buffering' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  streamingStatus === 'live' ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' :
                  streamingStatus === 'buffering' ? 'bg-amber-500 dark:bg-amber-400 animate-spin' :
                  'bg-rose-500 dark:bg-rose-400'
                }`}></span>
                {streamingStatus}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">No active stream registered</span>
          )}
        </div>

        {/* INTEGRATED PLAYBACK CONTROL BAR */}
        <div className="flex items-center justify-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-inner w-full sm:w-auto" id="camera_footer_control_bar">
          <button
            onClick={() => {
              setIsPlaying(true);
              if (selectedCam && selectedCam.device_status !== 'offline' && streamingStatus !== 'live') {
                setStreamingStatus('buffering');
                setTimeout(() => setStreamingStatus('live'), 600);
              }
            }}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-bold tracking-wider ${
              isPlaying
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
            }`}
            title="Resume Live Stream Parsing (Play)"
            id="footer_play_btn"
          >
            <Play size={12} fill={isPlaying ? "currentColor" : "none"} />
            <span>PLAY</span>
          </button>

          <button
            onClick={() => setIsPlaying(false)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-bold tracking-wider ${
              !isPlaying
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
            }`}
            title="Pause Live Stream Parsing (Pause)"
            id="footer_pause_btn"
          >
            <Pause size={12} fill={!isPlaying ? "currentColor" : "none"} />
            <span>PAUSE</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 self-center mx-1 hidden sm:block"></div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[10px] font-bold tracking-wider ${
              isFullScreen
                ? 'bg-blue-600/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-sm'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
            }`}
            title={isFullScreen ? 'Exit full-screen mode' : 'Enter immersive full-screen mode'}
            id="footer_fullscreen_btn"
          >
            {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullScreen ? 'MINIMIZE' : 'FULLSCREEN'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full xl:w-auto justify-end">
          {/* OBJECT DETECTION SPARKLINE CARD */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/80 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center gap-2.5 min-w-[155px] h-[38px]" id="detection_sparkline_card">
            <Activity className="text-blue-500 shrink-0" size={13} />
            <div className="flex flex-col shrink-0">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold leading-none">60s Tracks</span>
              <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold leading-tight mt-0.5">
                {selectedCam && streamingStatus === 'live' && isPlaying ? `${detectionHistory[detectionHistory.length - 1]?.count || 0} active` : '0 active'}
              </span>
            </div>
            <div className="w-14 h-6 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={detectionHistory} margin={{ top: 1, right: 1, left: 1, bottom: 1 }}>
                  <defs>
                    <linearGradient id="colorCountSpark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#colorCountSpark)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FPS CARD */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/80 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center gap-2.5 min-w-[95px]">
            <Activity className="text-emerald-500 shrink-0" size={13} />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold leading-none">Stream FPS</span>
              <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold leading-tight mt-0.5">
                {selectedCam && streamingStatus === 'live' && isPlaying ? `${liveFps} FPS` : '0.0 FPS'}
              </span>
            </div>
          </div>

          {/* RESOLUTION CARD */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/80 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center gap-2.5 min-w-[125px]">
            <Monitor className="text-blue-500 shrink-0" size={13} />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold leading-none">Resolution</span>
              <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold leading-tight mt-0.5">
                {selectedCam ? selectedCam.resolution : '1280x720'}
              </span>
            </div>
          </div>

          {/* BITRATE CARD */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/80 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center gap-2.5 min-w-[105px]">
            <Wifi className="text-cyan-500 shrink-0" size={13} />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold leading-none">Bitrate</span>
              <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold leading-tight mt-0.5">
                {selectedCam && streamingStatus === 'live' && isPlaying ? liveBitrate : '0.0 Mbps'}
              </span>
            </div>
          </div>

          {/* LATENCY CARD */}
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900/80 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex items-center gap-2.5 min-w-[95px]">
            <SlidersHorizontal className="text-amber-500 shrink-0" size={13} />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold leading-none">Latency</span>
              <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold leading-tight mt-0.5">
                {selectedCam && streamingStatus === 'live' && isPlaying ? `${liveLatency} ms` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* RETHINK DIALOG FORM: REGISTER REAL-TIME NETWORK CAMERAS */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100"
            >
              {/* Modal Title bar */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2 text-blue-400">
                  <Camera size={18} />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">Register Network Camera</span>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form block */}
              <form onSubmit={handleAddCameraSubmit} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-mono leading-relaxed">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Camera Description Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse A East Dock"
                    value={newCamName}
                    onChange={(e) => setNewCamName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">RTSP Connection URL Location</label>
                  <input
                    type="text"
                    required
                    placeholder="rtsp://admin:secret@192.168.1.55:554/h264"
                    value={newCamRtsp}
                    onChange={(e) => setNewCamRtsp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Physical Zone Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Loading Dock West Wing"
                    value={newCamLocation}
                    onChange={(e) => setNewCamLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Classes Allowed for Bounding overlays</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['Person', 'Car', 'Truck', 'License Plate', 'Forklift', 'Box'].map(cls => {
                      const isIncluded = newCamClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => {
                            setNewCamClasses(prev => 
                              prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
                            );
                          }}
                          className={`px-2 py-1.5 rounded border text-[11px] font-mono flex items-center justify-between transition-all cursor-pointer ${
                            isIncluded
                              ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          <span>{cls}</span>
                          {isIncluded && <Check size={11} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>REGISTER</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
