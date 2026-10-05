'use client';

import React from 'react';
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
            YOLOv8 Edge Hardware
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#D9DCD5] shadow-xs">
          <div className="text-xs font-semibold text-[#747A73] uppercase tracking-wider">
            Active Camera Nodes
          </div>
          <div className="sf-kpi text-3xl sm:text-4xl text-[#E7B900] mt-2">
            04 / 05
          </div>
          <div className="text-xs text-[#555B55] mt-1">
            99.9% Uptime
          </div>
        </div>
      </div>

      {/* Hourly Trend Chart */}
      <div className="p-6 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#1B1D1A]">Hourly Detection Activity</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorPersons" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3F8F5B" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3F8F5B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D9DCD5" vertical={false} />
              <XAxis dataKey="time" stroke="#747A73" fontSize={11} />
              <YAxis stroke="#747A73" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#D9DCD5',
                  borderRadius: '8px',
                  fontSize: '12px' 
                }} 
              />
              <Area type="monotone" dataKey="persons" stroke="#3F8F5B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPersons)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
