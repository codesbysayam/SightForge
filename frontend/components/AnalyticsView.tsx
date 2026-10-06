'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Clock, Activity, Calendar, 
  Download, ArrowUpRight, Cpu, User, ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

const hourlyData = [
  { time: '08:00', persons: 24, vehicles: 45 },
  { time: '10:00', persons: 86, vehicles: 72 },
  { time: '12:00', persons: 140, vehicles: 60 },
  { time: '14:00', persons: 95, vehicles: 54 },
  { time: '16:00', persons: 180, vehicles: 98 },
  { time: '18:00', persons: 110, vehicles: 85 },
];

export default function AnalyticsView() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A]">
            Computer Vision Analytics
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Fleet aggregation, person traffic trends, and detection class breakdowns.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs">
          <Download size={14} />
          <span>Export Analytics</span>
        </button>
      </div>

      {/* KPI Cards (Using Arial Black font) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-xs font-semibold text-[#747A73] uppercase tracking-wider">
            Total Persons (Today)
          </div>
          <div className="sf-kpi text-3xl sm:text-4xl text-[#1B1D1A] mt-2">
            635
          </div>
          <div className="text-xs text-[#3F8F5B] mt-1 font-semibold">
            +14% vs yesterday
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-xs font-semibold text-[#747A73] uppercase tracking-wider">
            Avg Inference Latency
          </div>
          <div className="sf-kpi text-3xl sm:text-4xl text-[#3F8F5B] mt-2">
            18.2ms
          </div>
          <div className="text-xs text-[#555B55] mt-1">
            Edge Jetson Orin Nano
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-xs font-semibold text-[#747A73] uppercase tracking-wider">
            Detection Accuracy
          </div>
          <div className="sf-kpi text-3xl sm:text-4xl text-[#1B1D1A] mt-2">
            94.8%
          </div>
          <div className="text-xs text-[#555B55] mt-1">
            mAP@0.50 (YOLOv8s)
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="p-5 rounded-xl bg-white border border-[#D9DCD5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1B1D1A]">
            Hourly Person Traffic Density
          </h2>
          <span className="text-xs text-[#747A73]">Live Feed Aggregated</span>
        </div>

        <div className="h-64 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECE8" />
                <XAxis dataKey="time" stroke="#747A73" fontSize={11} />
                <YAxis stroke="#747A73" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="persons" stroke="#3F8F5B" fill="#EEF8F0" strokeWidth={2} name="Persons" />
                <Area type="monotone" dataKey="vehicles" stroke="#4D78A8" fill="#E6EEF7" strokeWidth={2} name="Vehicles" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-[#F2F3EF] rounded-lg animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
