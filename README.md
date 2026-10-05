# SIGHTFORGE: Real-Time Computer Vision Platform

SIGHTFORGE is an enterprise-grade platform designed for real-time edge computer vision, multi-stream video analysis, YOLOv8 object detection, human pose estimation, and persistent Multi-Object Tracking (ByteTrack).

---

## Computer Vision Pipeline

```
Camera / Video Stream
       │
       ▼
OpenCV / WebRTC Frame Capture (1280x720 / 1920x1080)
       │
       ▼
Frame Validation & Foreground Pixel Verification
       │
  ┌────┴─────────────────────────────┐
  │                                  │
  ▼                                  ▼
YOLOv8 Person Detector         YOLOv8 Pose Estimator
(COCO Class ID 0 = Person)     (17 COCO Keypoints)
  │                                  │
  ▼                                  ▼
Non-Maximum Suppression (IoU 0.45)  Eyes / Nose / Ears / Limbs
  │                                  │
  └──────────────────┬───────────────┘
                     │
                     ▼
             ByteTrack Tracker
       (Persistent Object Track IDs)
                     │
                     ▼
          Canonical CV Result Frame
                     │
                     ▼
         HTML5 Canvas Overlay (16:9)
     (Person Bounding Boxes + Skeleton)
                     │
                     ▼
        Live Telemetry & Counting
```

---

## Detection State Lifecycle

1. **Authoritative Current Frame**: Every processed frame produces a complete, self-contained CV state (`CVFrame`).
2. **Atomic Replacement**: Current frame state atomically replaces previous frame state. Detection arrays are never merged across frames.
3. **Empty Detections Are Valid**: When a room is empty or a subject leaves the frame, the engine emits `detections: []`, `poses: []`, `person_count: 0`, and `tracked_person_count: 0`, instantly clearing all canvas boxes and skeleton lines.
4. **Current Tracks vs Track History**:
   - **Current Tracks**: Visible subjects present in the active frame (`tracked_person_count`).
   - **Track History / Audit Logs**: Retained in historical analytics for audit compliance, but never used to render live overlays.
5. **Camera Switch & Disconnect Safety**: Switching cameras or pausing immediately invokes `resetFrame()`, eliminating stale ghost bounding boxes across streams.

---

## SIGHTFORGE Design System

- **Light-Only Theme**: Professional warm off-white (`#F7F7F3`), crisp white cards (`#FFFFFF`), warm surfaces (`#FFF9E8`), and subtle borders (`#D9DCD5`).
- **Accent Colors**: Accent Yellow (`#E7B900`), Status Green (`#3F8F5B`), Alert Pink (`#D96B83`), Technical Blue (`#4D78A8`).
- **Typography Hierarchy**:
  - `Montserrat` for primary UI navigation, sidebar, buttons, and form labels.
  - `Arial Black` for major KPI numerical metrics.
  - `Times New Roman` for editorial report and audit titles.
  - `Aharoni` for selective brand moments.

---

## Testing & Diagnostics

```bash
# Test CV pipeline on sample frame
python scripts/test_cv_pipeline.py --confidence 0.35 --iou 0.45

# Test person detection
python scripts/test_person_detection.py --confidence 0.35
```
