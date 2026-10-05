#!/usr/bin/env python3
"""
SIGHTFORGE Person Detection Diagnostic Tool
"""

import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="Test person detection on sample frame")
    parser.add_argument("--image", type=str, default="tests/assets/person.jpg")
    parser.add_argument("--confidence", type=float, default=0.35)
    args = parser.parse_args()

    print("=" * 60)
    print("SIGHTFORGE PERSON DETECTION DIAGNOSTIC")
    print(f"Confidence threshold: {args.confidence} ({int(args.confidence * 100)}%)")
    print(f"Target class: person (COCO ID 0)")
    print("Device: CPU/Auto")
    print("=" * 60)

if __name__ == "__main__":
    main()
