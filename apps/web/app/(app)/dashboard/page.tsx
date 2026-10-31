'use client';

import React from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ChevronRight,
  Target,
  Zap,
  Kanban,
} from 'lucide-react';
import { INITIAL_CANDIDATES, INITIAL_JOBS, RECENT_ACTIVITIES } from '../../../lib/mock-data';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* AI Daily Briefing Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-900/90 to-emerald-950/30 border border-violet-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-36 h-36 text-violet-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>RecruitFlow AI Intelligence Engine</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Good morning, Shruvie. You have 3 high-priority actions today.
            </h1>
            <p className="text-xs md:text-sm text-slate-300">
              Marcus Vance has an offer draft ready for review (98% match). Sarah Chen's technical interview feedback has been submitted with positive recommendation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/assistant"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition shadow-lg shadow-violet-600/25"
            >
              <Zap className="w-4 h-4" />
              <span>Ask AI Copilot</span>
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Candidates</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">24</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +12% this mo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 4 departments</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Open Requisitions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">4</span>
            <span className="text-xs font-semibold text-blue-400">3 Priority Roles</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Target fill date in 18 days</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Avg. Time to Hire</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">16.4</span>
            <span className="text-xs font-medium text-slate-400">days</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              -4.2 days vs avg
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Top decile efficiency</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Offer Acceptance Rate</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">92.5%</span>
            <span className="text-xs font-semibold text-emerald-400">11 of 12</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero dropouts at culture stage</p>
        </div>
      </div>

      {/* Main Grid: Pipeline Highlights & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Candidates & Open Roles (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Candidates Card */}
          <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Top Matched Candidates</h2>
                <p className="text-xs text-slate-400">Scored by RecruitFlow Semantic AI Engine</p>
              </div>
              <a
                href="/candidates"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>View all candidates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="divide-y divide-slate-800/60">
              {INITIAL_CANDIDATES.slice(0, 4).map((cand) => (
                <div key={cand.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={cand.avatarUrl}
                      alt={cand.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 truncate">{cand.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {cand.stage}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{cand.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400">{cand.matchScore}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500">AI Match</span>
                    </div>

                    <a
                      href="/pipeline"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      Pipeline
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Requisitions */}
          <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Active Job Requisitions</h2>
                <p className="text-xs text-slate-400">Tenant scoped hiring pipeline</p>
              </div>
              <a
                href="/jobs"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>Manage jobs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {INITIAL_JOBS.map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 hover:border-slate-700 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">{job.title}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          job.status === 'OPEN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {job.department} · {job.location} · {job.hiringManager}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-bold text-slate-200">{job.candidatesCount}</span>
                      <p className="text-[10px] text-slate-500">Candidates</p>
                    </div>
                    <a
                      href="/pipeline"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="View in pipeline"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Activity Feed & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-5">
            <h2 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Quick Workflows</span>
            </h2>
            <div className="space-y-2">
              <a
                href="/assistant"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-violet-950/30 border border-slate-700/50 hover:border-violet-500/40 text-xs font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>Draft Offer Letter with AI</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-violet-400 transition" />
              </a>

              <a
                href="/pipeline"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-emerald-950/30 border border-slate-700/50 hover:border-emerald-500/40 text-xs font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <Kanban className="w-4 h-4 text-emerald-400" />
                  <span>Open Hiring Kanban</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
              </a>

              <a
                href="/candidates"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 hover:bg-blue-950/30 border border-slate-700/50 hover:border-blue-500/40 text-xs font-medium text-slate-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Parse New Resumes</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition" />
              </a>
            </div>
          </div>

          {/* Realtime Event Log */}
          <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-100">Live Activity Feed</h2>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE
              </span>
            </div>

            <div className="space-y-4">
              {RECENT_ACTIVITIES.map((act) => (
                <div key={act.id} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {act.icon === 'TrendingUp' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {act.icon === 'Sparkles' && <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                    {act.icon === 'Calendar' && <Calendar className="w-3.5 h-3.5 text-blue-400" />}
                    {act.icon === 'CheckCircle2' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-200">{act.candidateName}</p>
                    <p className="text-[11px] text-slate-400 leading-snug">{act.detail}</p>
                    <span className="text-[10px] text-slate-500">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
