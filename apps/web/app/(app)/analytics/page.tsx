'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Target,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

const FUNNEL_DATA = [
  { stage: 'Sourced & Applied', count: 142, percentage: 100, color: 'bg-slate-600' },
  { stage: 'Screening Passed', count: 68, percentage: 48, color: 'bg-blue-600' },
  { stage: 'Technical Interviews', count: 28, percentage: 20, color: 'bg-purple-600' },
  { stage: 'Culture & Leadership', count: 14, percentage: 10, color: 'bg-amber-600' },
  { stage: 'Offers Extended', count: 10, percentage: 7, color: 'bg-emerald-600' },
  { stage: 'Offers Accepted', count: 9, percentage: 6.3, color: 'bg-green-500' },
];

const SOURCES = [
  { name: 'Employee Referrals', percentage: 42, hires: 4, efficiency: 'Highest Quality' },
  { name: 'Outbound Sourced', percentage: 31, hires: 3, efficiency: 'Targeted Senior' },
  { name: 'Inbound Job Boards', percentage: 18, hires: 2, efficiency: 'High Volume' },
  { name: 'Agencies / Events', percentage: 9, hires: 0, efficiency: 'Testing' },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Hiring Analytics & Funnel</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Q4 2026
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Realtime conversion metrics, drop-off analysis, and sourcing channel ROI.
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Last 30 Days</span>
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Overall Funnel Conversion</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">6.3%</div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <ArrowUpRight className="w-3 h-3" /> +1.8% vs industry average (4.5%)
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Average Time-to-Fill</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">16.4 Days</div>
          <span className="text-[11px] text-blue-400 flex items-center gap-1 mt-1 font-semibold">
            Fastest: Full Stack (11 days)
          </span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Offer Acceptance</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">90.0%</div>
          <span className="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
            9 of 10 accepted
          </span>
        </div>
      </div>

      {/* Funnel Breakdown */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100">Recruitment Funnel Velocity</h2>

        <div className="space-y-3.5">
          {FUNNEL_DATA.map((item) => (
            <div key={item.stage} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-200">{item.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">{item.count} candidates</span>
                  <span className="font-bold text-slate-100 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sourcing Channel Breakdown */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100">Sourcing Channel Efficiency</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SOURCES.map((src) => (
            <div key={src.name} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/70 space-y-1">
              <span className="text-xs font-semibold text-slate-200">{src.name}</span>
              <div className="text-xl font-bold text-emerald-400">{src.percentage}%</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{src.hires} Hires</span>
                <span className="text-slate-500">{src.efficiency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
