'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CVDetection {
  class_id: number;
  class_name: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  track_id: number | string | null;
  x1_norm?: number;
  y1_norm?: number;
  x2_norm?: number;
  y2_norm?: number;
}

export interface CVKeypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export interface CVPose {
  person_index: number;
  track_id: number | string | null;
  keypoints: CVKeypoint[];
}

export interface CVFrame {
  frame_id: number;
  timestamp: number;
  frame_width: number;
  frame_height: number;
  detections: CVDetection[];
  poses: CVPose[];
  faces: unknown[];
  person_count: number;
  tracked_person_count: number;
  inference_ms: number;
}

export const EMPTY_CV_FRAME: CVFrame = {
  frame_id: 0,
  timestamp: 0,
  frame_width: 1280,
  frame_height: 720,
  detections: [],
  poses: [],
  faces: [],
  person_count: 0,
  tracked_person_count: 0,
  inference_ms: 0,
};

export function useCVFrame() {
  const [cvFrame, setCVFrame] = useState<CVFrame>(EMPTY_CV_FRAME);
  const latestFrameId = useRef(0);
  const lastFrameReceived = useRef(Date.now());

  const resetFrame = useCallback(() => {
    latestFrameId.current += 1;
    lastFrameReceived.current = Date.now();
    setCVFrame({
      ...EMPTY_CV_FRAME,
      frame_id: latestFrameId.current,
      timestamp: Date.now(),
    });
  }, []);

  const receiveFrame = useCallback((incoming: CVFrame) => {
    if (!incoming) return;

    // Reject out-of-order frames
    if (incoming.frame_id < latestFrameId.current && incoming.frame_id !== 0) {
      return;
    }

    latestFrameId.current = incoming.frame_id;
    lastFrameReceived.current = Date.now();

    // Authoritative replacement of entire frame state (Never merge with stale detections)
    setCVFrame({
      frame_id: incoming.frame_id,
      timestamp: incoming.timestamp || Date.now(),
      frame_width: incoming.frame_width || 1280,
      frame_height: incoming.frame_height || 720,
      detections: incoming.detections ?? [],
      poses: incoming.poses ?? [],
      faces: incoming.faces ?? [],
      person_count: (incoming.detections ?? []).filter(
        (d) => d.class_name.toLowerCase() === 'person'
      ).length,
      tracked_person_count: (incoming.detections ?? []).filter(
        (d) => d.track_id != null
      ).length,
      inference_ms: incoming.inference_ms ?? 0,
    });
  }, []);

  // Stale data timeout: If no frame updates arrive in 1000ms, clear detections immediately
  useEffect(() => {
    const interval = window.setInterval(() => {
      const age = Date.now() - lastFrameReceived.current;
      if (age > 1000 && (cvFrame.detections.length > 0 || cvFrame.poses.length > 0)) {
        setCVFrame((prev) => ({
          ...EMPTY_CV_FRAME,
          frame_width: prev.frame_width,
          frame_height: prev.frame_height,
          frame_id: latestFrameId.current,
        }));
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [cvFrame.detections.length, cvFrame.poses.length]);

  return {
    cvFrame,
    detections: cvFrame.detections,
    poses: cvFrame.poses,
    faces: cvFrame.faces,
    personCount: cvFrame.person_count,
    trackedPersonCount: cvFrame.tracked_person_count,
    receiveFrame,
    resetFrame,
  };
}
