# SIGHTFORGE: Design System & Visual Specification

SIGHTFORGE implements a clean, high-density Light-Only design language crafted for enterprise computer vision observability and multi-stream edge tracking.

---

## 1. Color Palette & Tokens

- **Background (`--sf-bg`)**: `#F7F7F3` (Warm off-white base)
- **Primary Surfaces (`--sf-surface`)**: `#FFFFFF` (Crisp white cards)
- **Secondary Surfaces (`--sf-surface-soft`)**: `#F2F3EF`
- **Warm Highlight (`--sf-surface-warm` / `--sf-yellow-soft`)**: `#FFF9E8` / `#FFF1A8`
- **Accent Yellow (`--sf-yellow`)**: `#E7B900` (Primary interactive actions, active sidebar indicator)
- **Status Green (`--sf-green` / `--sf-surface-green`)**: `#3F8F5B` / `#EEF8F0` (Operational nodes, person bounding boxes, connected cameras)
- **Alert / Accent Pink (`--sf-pink` / `--sf-surface-pink`)**: `#D96B83` / `#FFF0F3` (Anomalies, stream errors)
- **Technical Blue (`--sf-blue` / `--sf-surface-blue`)**: `#4D78A8` / `#E6EEF7`
- **Borders (`--sf-border` / `--sf-border-strong`)**: `#D9DCD5` / `#C4C9C1`
- **Text (`--sf-text`)**: `#1B1D1A` (Charcoal black, WCAG AAA contrast)
- **Text Secondary / Muted (`--sf-text-secondary` / `--sf-text-muted`)**: `#555B55` / `#747A73`

---

## 2. Typography Hierarchy

- **Primary UI Font**: `Montserrat`, Arial, sans-serif
  - Used for sidebar navigation, header controls, form buttons, table headers, labels, and badges.
- **KPI Emphasis Font**: `Arial Black`, Arial, sans-serif
  - Used strictly for major headline numbers (Persons in Frame, Active Tracks, Total Frames).
- **Editorial & Document Font**: `Times New Roman`, Times, serif
  - Used for report document headings, formal audit titles, and technical documentation titles.
- **Brand Display Font**: `Aharoni`, `Arial Black`, `Montserrat`, sans-serif
  - Used selectively for high-level brand title moments.
- **Technical Coordinates & Logs**: `Montserrat Medium` & `monospace`
  - Used for bounding box vectors `[x1, y1, x2, y2]`, RTSP URLs, and telemetry timestamps.

---

## 3. Sidebar & Header Layout

- **Header**: 64px height, crisp white surface, border bottom `1px solid #D9DCD5`, workspace node switcher, global search command palette launcher (`⌘K`), and system notification center. No dark mode toggle.
- **Sidebar**: 240px persistent desktop drawer, responsive slide-out mobile drawer with backdrop. Active navigation items feature a `3px solid #E7B900` left accent bar and `#FFF9E8` warm background.

---

## 4. Computer Vision Overlay Specification

- **Detection Bounding Box**: 2px solid `#3F8F5B` with subtle corner focus marks (`#E7B900`) and a crisp white label badge displaying `Person {conf}% · ID {trackId}`.
- **Human Pose**: 17-point standard COCO skeleton with yellow joint connections and distinct amber/green markers for eyes and nose.
- **Coordinate Space**: Normalized rendering using exact scale factors `scaleX = renderedW / sourceW` and `scaleY = renderedH / sourceH`.
