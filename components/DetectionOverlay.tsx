'use client';

import React, { useEffect, useRef } from 'react';
import { CVDetection, CVPose, CVKeypoint } from '../hooks/useCVFrame';

export type Detection = CVDetection;
export type Pose = CVPose;
export type Keypoint = CVKeypoint;

export interface DetectionOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  detections: CVDetection[];
  poses?: CVPose[];
  sourceWidth?: number;
  sourceHeight?: number;
  showLabels?: boolean;
  showConfidence?: boolean;
  showTrackIds?: boolean;
  showSkeleton?: boolean;
  showKeypoints?: boolean;
  color?: string;
  debugMode?: boolean;
}

// 17-point standard COCO skeleton links
const SKELETON_PAIRS: [string, string][] = [
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
];

export function DetectionOverlay({
  videoRef,
  detections = [],
  poses = [],
  sourceWidth = 1280,
  sourceHeight = 720,
  showLabels = true,
  showConfidence = true,
  showTrackIds = true,
  showSkeleton = true,
  showKeypoints = true,
  color = '#3F8F5B', // SIGHTFORGE Forest Green
  debugMode = false,
}: DetectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!canvas) return;

    const draw = () => {
      const srcW = video?.videoWidth || sourceWidth || 1280;
      const srcH = video?.videoHeight || sourceHeight || 720;

      if (!srcW || !srcH) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Match internal canvas resolution to actual display size * DPR
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ALWAYS clear previous frame completely
      ctx.clearRect(0, 0, rect.width, rect.height);

      // If no current detections or poses exist in this frame, leave canvas completely empty
      if ((!detections || detections.length === 0) && (!poses || poses.length === 0)) {
        return;
      }

      // Exact scale ratio from source video coordinates to rendered canvas pixels
      const scaleX = rect.width / srcW;
      const scaleY = rect.height / srcH;

      // 1. RENDER CURRENT PERSON BOUNDING BOXES
      for (const det of detections) {
        const x = det.x1 * scaleX;
        const y = det.y1 * scaleY;
        const w = (det.x2 - det.x1) * scaleX;
        const h = (det.y2 - det.y1) * scaleY;

        // Bounding box rectangle
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const cornerLen = Math.min(14, w * 0.2, h * 0.2);
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#E7B900'; // Amber corner accent
        
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerLen);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerLen, y + h);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerLen);
        ctx.stroke();

        // Header Label Tag
        if (showLabels) {
          const parts: string[] = [det.class_name];
          if (showTrackIds && det.track_id !== null && det.track_id !== undefined) {
            parts.push(`#${det.track_id}`);
          }
          if (showConfidence) {
            parts.push(`${Math.round(det.confidence * 100)}%`);
          }
          const labelText = parts.join(' ');

          ctx.font = '600 11px system-ui, -apple-system, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const paddingH = 6;
          const tagH = 18;
          const tagW = textMetrics.width + paddingH * 2;
          const tagY = Math.max(0, y - tagH);

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(x, tagY, tagW, tagH, [4, 4, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, x + paddingH, tagY + 13);
        }
      }

      // 2. RENDER ANATOMICAL SKELETON
      if (showSkeleton && poses) {
        for (const pose of poses) {
          const kpMap = new Map<string, { x: number; y: number; conf: number }>();
          for (const kp of pose.keypoints) {
            kpMap.set(kp.name, {
              x: kp.x * scaleX,
              y: kp.y * scaleY,
              conf: kp.confidence,
            });
          }

          // Draw skeleton connection lines
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#E7B900'; // Amber skeleton links

          for (const [from, to] of SKELETON_PAIRS) {
            const p1 = kpMap.get(from);
            const p2 = kpMap.get(to);
            if (p1 && p2 && p1.conf > 0.4 && p2.conf > 0.4) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }

          // Draw keypoint joints
          if (showKeypoints) {
            for (const kp of pose.keypoints) {
              if (kp.confidence > 0.4) {
                const kx = kp.x * scaleX;
                const ky = kp.y * scaleY;

                ctx.beginPath();
                ctx.arc(kx, ky, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#3F8F5B';
                ctx.fill();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();
              }
            }
          }
        }
      }
    };

    draw();
  }, [
    videoRef,
    detections,
    poses,
    sourceWidth,
    sourceHeight,
    showLabels,
    showConfidence,
    showTrackIds,
    showSkeleton,
    showKeypoints,
    color,
    debugMode,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
