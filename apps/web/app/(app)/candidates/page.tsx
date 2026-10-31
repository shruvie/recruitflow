'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Calendar,
  X,
  ExternalLink,
  CheckCircle2,
  FileText,
  Database,
} from 'lucide-react';
import { INITIAL_CANDIDATES, Candidate } from '../../../lib/mock-data';
import { CandidateStatus, CandidateSource } from '@recruitflow/core';
import { getCandidates, supabase, isSupabaseConfigured } from '../../../lib/supabase';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  useEffect(() => {
    setIsDbConnected(isSupabaseConfigured());
    getCandidates().then((data) => {
      if (data && data.length > 0) {
        setCandidates(data);
      }
    });
  }, []);

  // New candidate form state
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Senior Full Stack Engineer',
    skills: 'TypeScript, Next.js, PostgreSQL',
    location: 'Remote, US',
    experienceYears: 5,
  });

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: Candidate = {
      id: `cand_${Date.now()}`,
      name: newCandidate.name,
      email: newCandidate.email,
      phone: newCandidate.phone || '+1 (555) 019-2831',
      role: newCandidate.role,
      status: CandidateStatus.ACTIVE,
      source: CandidateSource.SOURCED,
      stage: 'Sourced',
      matchScore: 91,
      skills: newCandidate.skills.split(',').map((s) => s.trim()),
      experienceYears: Number(newCandidate.experienceYears),
      location: newCandidate.location,
      appliedDate: new Date().toISOString().split('T')[0]!,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      notes: 'Added manually via Recruiter Portal.',
      summary: 'Candidate profile added for consideration. AI matching initialized.',
    };

    setCandidates([candidate, ...candidates]);
    setIsAddModalOpen(false);

    if (isSupabaseConfigured()) {
      const parts = newCandidate.name.trim().split(' ');
      const firstName = parts[0] || 'Candidate';
      const lastName = parts.slice(1).join(' ') || '';

      await supabase.from('candidates').insert({
        organization_id: '00000000-0000-0000-0000-000000000001',
        first_name: firstName,
        last_name: lastName,
        email: newCandidate.email,
        phone: newCandidate.phone || null,
        current_title: newCandidate.role,
        years_of_experience: Number(newCandidate.experienceYears),
        location: newCandidate.location,
        source: 'SOURCED',
        status: 'ACTIVE',
        summary: `Skills: ${newCandidate.skills}. Profile added via Recruiter Portal.`,
      });
    }
    setNewCandidate({
      name: '',
      email: '',
      phone: '',
      role: 'Senior Full Stack Engineer',
      skills: 'TypeScript, Next.js, PostgreSQL',
      location: 'Remote, US',
      experienceYears: 5,
    });
  };

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Candidate Pool</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {candidates.length} Total
            </span>
            {isDbConnected ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase Live</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Demo Pool</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Search, filter, and review AI-matched applicants across all open requisitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, skill..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Candidate</th>
              <th className="py-3 px-4">Role & Stage</th>
              <th className="py-3 px-4">AI Match</th>
              <th className="py-3 px-4">Top Skills</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelectedCandidate(c)}
                className="hover:bg-slate-800/40 transition cursor-pointer"
              >
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700 flex-shrink-0"
                    />
                    <div>
                      <span className="font-bold text-slate-100 hover:text-emerald-400 transition">
                        {c.name}
                      </span>
                      <p className="text-[11px] text-slate-400">{c.email}</p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div>
                    <span className="text-slate-200 font-medium">{c.role}</span>
                    <div className="mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {c.stage}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${c.matchScore}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-emerald-400 text-xs">{c.matchScore}%</span>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {c.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60"
                      >
                        {s}
                      </span>
                    ))}
                    {c.skills.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{c.skills.length - 3}</span>
                    )}
                  </div>
                </td>

                <td className="py-3.5 px-4 text-slate-400">{c.location}</td>

                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCandidate(c);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Candidate Profile Drawer / Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
              <img
                src={selectedCandidate.avatarUrl}
                alt={selectedCandidate.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/40"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedCandidate.name}</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedCandidate.matchScore}% Match
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedCandidate.role}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {selectedCandidate.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {selectedCandidate.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {selectedCandidate.location}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Executive Resume Summary */}
            <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Candidate Synthesis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedCandidate.summary}</p>
            </div>

            {/* Skills Matrix */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Skills & Stacks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interview Notes */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recruiter & Interview Notes
              </h3>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                {selectedCandidate.notes}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-500">
                Applied on {selectedCandidate.appliedDate} · Stage: {selectedCandidate.stage}
              </div>
              <a
                href="/pipeline"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                Promote in Pipeline →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white">Add Candidate to Pipeline</h2>

            <form onSubmit={handleAddCandidate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    placeholder="+1 555 0192"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Role</label>
                <select
                  value={newCandidate.role}
                  onChange={(e) => setNewCandidate({ ...newCandidate, role: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Senior Full Stack Engineer">Senior Full Stack Engineer</option>
                  <option value="AI / ML Research Scientist">AI / ML Research Scientist</option>
                  <option value="Lead Product Designer">Lead Product Designer</option>
                  <option value="Senior DevOps / SRE">Senior DevOps / SRE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newCandidate.skills}
                  onChange={(e) => setNewCandidate({ ...newCandidate, skills: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
