'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  CheckCircle,
  Briefcase,
  MapPin,
  Clock,
} from 'lucide-react';
import { INITIAL_CANDIDATES, PIPELINE_STAGES, Candidate } from '../../../lib/mock-data';

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const moveCandidate = (id: string, direction: 'forward' | 'backward') => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentIdx = PIPELINE_STAGES.findIndex((s) => s.name === c.stage);
        if (currentIdx === -1) return c;
        const newIdx = direction === 'forward' ? currentIdx + 1 : currentIdx - 1;
        if (newIdx < 0 || newIdx >= PIPELINE_STAGES.length) return c;
        return { ...c, stage: PIPELINE_STAGES[newIdx]!.name };
      })
    );
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesRole = selectedRole === 'ALL' || c.role === selectedRole;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Recruitment Pipeline</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Kanban Board
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Drag or promote candidates through stages with tenant audit trails.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or skill..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Requisitions</option>
            <option value="Senior Full Stack Engineer">Senior Full Stack Engineer</option>
            <option value="AI / ML Research Scientist">AI / ML Research Scientist</option>
            <option value="Lead Product Designer">Lead Product Designer</option>
            <option value="Senior DevOps / SRE">Senior DevOps / SRE</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {PIPELINE_STAGES.map((stage, stageIdx) => {
          const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.name);

          return (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0 flex flex-col rounded-xl bg-slate-950/70 border border-slate-800/80 max-h-[calc(100vh-210px)]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">{stage.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                    {stageCandidates.length}
                  </span>
                </div>
              </div>

              {/* Cards List */}
              <div className="p-2.5 overflow-y-auto space-y-3 flex-1">
                {stageCandidates.length === 0 ? (
                  <div className="py-8 text-center border-2 border-dashed border-slate-800/50 rounded-lg">
                    <p className="text-[11px] text-slate-500">No candidates in this stage</p>
                  </div>
                ) : (
                  stageCandidates.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-3 group"
                    >
                      {/* Candidate Head */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={c.avatarUrl}
                            alt={c.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{c.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{c.role}</p>
                          </div>
                        </div>

                        {/* AI Match badge */}
                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{c.matchScore}%</span>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Location & Experience */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-500" />
                          {c.location}
                        </span>
                        <span>{c.experienceYears}y exp</span>
                      </div>

                      {/* Stage Move Controls */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          disabled={stageIdx === 0}
                          onClick={() => moveCandidate(c.id, 'backward')}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition text-[10px] flex items-center gap-1"
                          title="Move to previous stage"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Prev</span>
                        </button>

                        <button
                          disabled={stageIdx === PIPELINE_STAGES.length - 1}
                          onClick={() => moveCandidate(c.id, 'forward')}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 disabled:opacity-20 disabled:hover:bg-slate-800 disabled:hover:text-emerald-400 transition text-[10px] font-semibold flex items-center gap-1 shadow-sm"
                          title="Advance to next stage"
                        >
                          <span>Advance</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
