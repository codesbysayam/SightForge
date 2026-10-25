'use client';

import { useCallback, useState } from 'react';

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

  const receiveFrame = useCallback((frame: CVFrame) => {
    setCVFrame(frame);
  }, []);

  const resetFrame = useCallback(() => {
    setCVFrame(EMPTY_CV_FRAME);
  }, []);

  return {
    cvFrame,
    detections: cvFrame.detections,
    poses: cvFrame.poses,
    personCount: cvFrame.person_count,
    trackedPersonCount: cvFrame.tracked_person_count,
    receiveFrame,
    resetFrame,
  };
}
