'use client';

import React from 'react';
import { 
  Server, Cpu, Database, HardDrive, Wifi, CheckCircle2, 
  RefreshCw, ShieldCheck, Activity, Clock
} from 'lucide-react';
import { BRAND } from '../config/brand';

export default function SystemStatusView() {
  const nodes = [
    { name: 'Core Web Interface', status: 'Online', latency: '2ms', load: '12%' },
    { name: 'YOLOv8 Inference Worker', status: 'Online', latency: '16ms', load: '38%' },
    { name: 'ByteTrack Multi-Object Tracker', status: 'Online', latency: '4ms', load: '18%' },
    { name: 'RTSP Video Ingestion Gateway', status: 'Online', latency: '6ms', load: '24%' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Infrastructure & Node Status
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            System uptime, edge compute telemetry, and microservice status.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#EEF8F0] border border-[#D9DCD5] text-xs font-semibold text-[#3F8F5B] flex items-center gap-1.5 shadow-xs">
          <CheckCircle2 size={14} />
          <span>All Nodes Operational</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {nodes.map((node) => (
          <div
            key={node.name}
            className="p-5 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-[#1B1D1A] flex items-center gap-2">
                <Server size={16} className="text-[#3F8F5B]" />
                <span>{node.name}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#3F8F5B] bg-[#EEF8F0] px-2 py-0.5 rounded">
                {node.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#D9DCD5]/60 text-[11px]">
              <div>
                <span className="text-[#747A73]">Latency:</span>
                <span className="font-mono font-bold text-[#1B1D1A] ml-1.5">{node.latency}</span>
              </div>
              <div>
                <span className="text-[#747A73]">Compute Load:</span>
                <span className="font-mono font-bold text-[#1B1D1A] ml-1.5">{node.load}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
