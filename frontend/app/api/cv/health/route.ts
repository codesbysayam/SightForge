import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    person_detector: {
      loaded: true,
      model: 'yolov8n.pt',
      person_class_available: true,
      default_confidence: 0.35,
      default_iou: 0.45,
    },
    pose_detector: {
      loaded: true,
      model: 'yolov8n-pose.pt',
      keypoints: [
        'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
        'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
        'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
        'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
      ],
      keypoint_confidence: 0.35,
    },
    face_detector: {
      loaded: false,
      reason: 'No dedicated face model configured (using YOLO pose keypoints for facial landmarks)',
    },
    tracking: {
      enabled: true,
      tracker: 'ByteTrack',
    },
    device: 'Client Hardware / Edge Engine',
    timestamp: '2026-10-05T12:00:00.000Z',
  });
}
