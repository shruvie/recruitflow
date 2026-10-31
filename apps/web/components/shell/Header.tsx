'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  Sparkles,
  Command,
  Radio,
  UserPlus,
  Briefcase,
} from 'lucide-react';

interface HeaderProps {
  onAddCandidate?: () => void;
  onCreateJob?: () => void;
}

export function Header({ onAddCandidate, onCreateJob }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search candidates, skills, jobs... (Press ⌘K)"
          className="w-full pl-9 pr-12 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
        />
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Realtime Stream Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SSE Live</span>
        </div>

        {/* AI Quick Assistant Link */}
        <a
          href="/assistant"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/10 text-violet-300 border border-violet-500/30 hover:bg-violet-600/20 hover:border-violet-500/50 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>AI Co-Pilot</span>
        </a>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {onAddCandidate && (
            <button
              onClick={onAddCandidate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-600/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Candidate</span>
            </button>
          )}

          {onCreateJob && (
            <button
              onClick={onCreateJob}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>New Job</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#0B0F19]"></span>
        </button>
      </div>
    </header>
  );
}
