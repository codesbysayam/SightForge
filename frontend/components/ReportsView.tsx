'use client';

import React, { useState } from 'react';
import { 
  FileText, Download, Filter, Search, Calendar, 
  Eye, CheckCircle2, FileSpreadsheet, FileJson
} from 'lucide-react';
import { BRAND } from '../config/brand';

interface ReportItem {
  id: string;
  title: string;
  date: string;
  type: 'daily' | 'audit' | 'incident' | 'weekly';
  status: 'Ready' | 'Generating';
  fileSize: string;
  personDetections: number;
}

export default function ReportsView() {
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: 'REP-2026-10-05',
      title: 'Daily Edge Detection & Fleet Audit Report',
      date: 'Oct 05, 2026',
      type: 'daily',
      status: 'Ready',
      fileSize: '2.4 MB',
      personDetections: 1420
    },
    {
      id: 'REP-2026-10-04',
      title: 'Perimeter Access & Person Counting Summary',
      date: 'Oct 04, 2026',
      type: 'daily',
      status: 'Ready',
      fileSize: '3.1 MB',
      personDetections: 1890
    },
    {
      id: 'REP-2026-10-01',
      title: 'Weekly Computer Vision Performance & Model Latency',
      date: 'Oct 01, 2026',
      type: 'weekly',
      status: 'Ready',
      fileSize: '5.8 MB',
      personDetections: 12400
    }
  ]);

  const [selectedReport, setSelectedReport] = useState<ReportItem>(reports[0]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D9DCD5]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B1D1A] font-sans">
            Reports & Export
          </h1>
          <p className="text-sm text-[#555B55] mt-0.5">
            Audit-grade detection summaries, telemetry logs, and exportable data sets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] font-semibold text-xs transition-colors shadow-xs">
            <Download size={15} />
            <span>Generate New Report</span>
          </button>
        </div>
      </div>

      {/* Editorial Report Document Preview (Uses Times New Roman for document headings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Report List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="font-semibold text-xs text-[#747A73] uppercase tracking-wider">
            Available Documents
          </div>

          <div className="space-y-2">
            {reports.map((rep) => {
              const isSelected = selectedReport.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-[#E7B900] bg-[#FFF9E8] shadow-xs'
                      : 'border-[#D9DCD5] hover:border-[#C4C9C1] hover:bg-[#F7F7F3]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#1B1D1A]">
                        {rep.title}
                      </div>
                      <div className="text-xs text-[#747A73] mt-1 flex items-center gap-2">
                        <span>{rep.date}</span>
                        <span>·</span>
                        <span className="font-mono">{rep.fileSize}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#EEF8F0] text-[#3F8F5B]">
                      {rep.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editorial Report Viewer (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-white border border-[#D9DCD5] shadow-xs space-y-6">
          {/* Document Header (Times New Roman serif) */}
          <div className="border-b border-[#D9DCD5] pb-4">
            <div className="text-xs font-semibold text-[#747A73] uppercase tracking-widest font-sans">
              {BRAND.name} Audit Document
            </div>
            <h2 className="sf-report-title text-2xl sm:text-3xl text-[#1B1D1A] mt-2">
              {selectedReport.title}
            </h2>
            <div className="text-xs text-[#555B55] mt-2 flex items-center gap-4 font-sans">
              <span>Date: <strong>{selectedReport.date}</strong></span>
              <span>Document ID: <strong className="font-mono">{selectedReport.id}</strong></span>
            </div>
          </div>

          {/* Report Summary Data */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-sans">
            <div className="p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
              <div className="text-[11px] text-[#747A73]">Total Persons</div>
              <div className="sf-kpi text-xl text-[#1B1D1A] mt-0.5">
                {selectedReport.personDetections.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
              <div className="text-[11px] text-[#747A73]">Detector Model</div>
              <div className="font-mono font-bold text-xs text-[#1B1D1A] mt-1.5">
                YOLOv8x (35% Conf)
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F7F7F3] border border-[#D9DCD5]">
              <div className="text-[11px] text-[#747A73]">Tracker Algorithm</div>
              <div className="font-mono font-bold text-xs text-[#3F8F5B] mt-1.5">
                ByteTrack MOT
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="pt-4 border-t border-[#D9DCD5] flex items-center justify-between font-sans">
            <span className="text-xs text-[#747A73]">Ready for immediate export</span>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F7F7F3] hover:bg-[#F2F3EF] border border-[#D9DCD5] text-xs font-semibold text-[#1B1D1A] transition-colors">
                <FileSpreadsheet size={15} className="text-[#3F8F5B]" />
                <span>Export CSV</span>
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#E7B900] hover:bg-[#D4A800] text-[#111310] text-xs font-semibold shadow-xs">
                <FileJson size={15} />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
