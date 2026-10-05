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
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
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

      // ----------------------------------------------------
      // 1. RENDER CURRENT PERSON BOUNDING BOXES
      // ----------------------------------------------------
      for (const det of detections) {
        const x = det.x1 * scaleX;
        const y = det.y1 * scaleY;
        const boxW = (det.x2 - det.x1) * scaleX;
        const boxH = (det.y2 - det.y1) * scaleY;

        if (boxW <= 8 || boxH <= 8) continue;

        // Clean bounding box line (2px solid)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxW, boxH);

        // Very subtle translucent fill for clarity
        ctx.fillStyle = 'rgba(63, 143, 91, 0.08)';
        ctx.fillRect(x, y, boxW, boxH);

        // Corner focus markers in SIGHTFORGE yellow accent
        const cornerLen = Math.min(14, boxW / 4, boxH / 4);
        ctx.strokeStyle = '#E7B900';
        ctx.lineWidth = 2.5;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + boxW - cornerLen, y);
        ctx.lineTo(x + boxW, y);
        ctx.lineTo(x + boxW, y + cornerLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + boxH - cornerLen);
        ctx.lineTo(x, y + boxH);
        ctx.lineTo(x + cornerLen, y + boxH);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + boxW - cornerLen, y + boxH);
        ctx.lineTo(x + boxW, y + boxH);
        ctx.lineTo(x + boxW, y + boxH - cornerLen);
        ctx.stroke();

        // Professional Label Tag
        if (showLabels) {
          const confPercent = Math.round(det.confidence * 100);
          let labelText = `${det.class_name}`;
          if (showConfidence) {
            labelText += ` ${confPercent}%`;
          }
          if (showTrackIds && det.track_id != null) {
            labelText += ` · ID ${det.track_id}`;
          }

          ctx.font = '600 11px Montserrat, -apple-system, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const badgeHeight = 22;
          const badgeWidth = textMetrics.width + 16;
          const labelY = Math.max(badgeHeight, y);

          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;

          ctx.beginPath();
          ctx.roundRect(x, labelY - badgeHeight, badgeWidth, badgeHeight, [4, 4, 4, 4]);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;

          ctx.strokeStyle = '#D9DCD5';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Left indicator dot
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x + 7, labelY - 11, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Text content
          ctx.fillStyle = '#1B1D1A';
          ctx.fillText(labelText, x + 15, labelY - 6.5);
        }

        // Debug coordinates overlay
        if (debugMode) {
          ctx.font = '500 10px Montserrat, monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(
            `x1:${Math.round(det.x1)} y1:${Math.round(det.y1)} x2:${Math.round(det.x2)} y2:${Math.round(det.y2)}`,
            x + 4,
            y + boxH - 8
          );
        }
      }

      // ----------------------------------------------------
      // 2. RENDER CURRENT HUMAN POSE SKELETON & KEYPOINTS
      // ----------------------------------------------------
      for (const pose of poses) {
        if (!pose || !pose.keypoints || pose.keypoints.length === 0) continue;

        const pointMap = new Map<string, CVKeypoint>();
        for (const kp of pose.keypoints) {
          pointMap.set(kp.name, kp);
        }

        // Draw Skeleton Connections
        if (showSkeleton) {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(231, 185, 0, 0.75)';

          for (const [startName, endName] of SKELETON_PAIRS) {
            const p1 = pointMap.get(startName);
            const p2 = pointMap.get(endName);

            if (p1 && p2 && p1.confidence >= 0.35 && p2.confidence >= 0.35) {
              ctx.beginPath();
              ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
              ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
              ctx.stroke();
            }
          }
        }

        // Draw Individual Keypoints
        if (showKeypoints) {
          for (const kp of pose.keypoints) {
            if (kp.confidence < 0.35) continue;

            const kx = kp.x * scaleX;
            const ky = kp.y * scaleY;
            const isEye = kp.name === 'left_eye' || kp.name === 'right_eye';
            const isNose = kp.name === 'nose';

            ctx.beginPath();
            if (isEye) {
              ctx.arc(kx, ky, 3.5, 0, Math.PI * 2);
              ctx.fillStyle = '#E7B900';
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.2;
              ctx.stroke();
            } else if (isNose) {
              ctx.arc(kx, ky, 3, 0, Math.PI * 2);
              ctx.fillStyle = '#3F8F5B';
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1;
              ctx.stroke();
            } else {
              ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
              ctx.strokeStyle = '#3F8F5B';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }
    };

    draw();

    let ro: ResizeObserver | null = null;
    if (video) {
      ro = new ResizeObserver(draw);
      ro.observe(video);
      video.addEventListener('loadedmetadata', draw);
      video.addEventListener('play', draw);
    }

    return () => {
      if (ro) ro.disconnect();
      if (video) {
        video.removeEventListener('loadedmetadata', draw);
        video.removeEventListener('play', draw);
      }
    };
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
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}
