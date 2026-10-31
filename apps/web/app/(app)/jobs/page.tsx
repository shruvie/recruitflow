'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MapPin,
  DollarSign,
  Users,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { INITIAL_JOBS, Job } from '../../../lib/mock-data';
import { JobStatus, EmploymentType, LocationType, Priority } from '@recruitflow/core';
import { formatCurrency } from '../../../lib/utils';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Job state
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    location: 'Remote, US',
    locationType: LocationType.REMOTE,
    type: EmploymentType.FULL_TIME,
    priority: Priority.HIGH,
    salaryMin: 150000,
    salaryMax: 180000,
    description: '',
    hiringManager: 'Elena Vance',
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Job = {
      id: `job_${Date.now()}`,
      title: newJob.title,
      department: newJob.department,
      status: JobStatus.OPEN,
      type: newJob.type,
      locationType: newJob.locationType,
      location: newJob.location,
      priority: newJob.priority,
      salaryMin: Number(newJob.salaryMin),
      salaryMax: Number(newJob.salaryMax),
      candidatesCount: 0,
      hiringManager: newJob.hiringManager,
      postedDate: new Date().toISOString().split('T')[0]!,
      description: newJob.description || 'Newly opened requisition. Ready for candidate sourcing.',
      requiredSkills: ['TypeScript', 'System Design'],
    };

    setJobs([created, ...jobs]);
    setIsModalOpen(false);
    setNewJob({
      title: '',
      department: 'Engineering',
      location: 'Remote, US',
      locationType: LocationType.REMOTE,
      type: EmploymentType.FULL_TIME,
      priority: Priority.HIGH,
      salaryMin: 150000,
      salaryMax: 180000,
      description: '',
      hiringManager: 'Elena Vance',
    });
  };

  const filtered = jobs.filter((j) => {
    const matchesStatus = statusFilter === 'ALL' || j.status === statusFilter;
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Job Requisitions</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {jobs.length} Positions
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Define requirements, salary bands, and manage hiring managers across departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Requisition</span>
          </button>
        </div>
      </div>

      {/* Grid of Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100">{job.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      job.status === 'OPEN'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {job.department} · Hiring Mgr: {job.hiringManager}
                </p>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {job.priority} Priority
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
              {job.description}
            </p>

            {/* Badges / Specs */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {job.location} ({job.locationType})
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                {formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}
              </span>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-300">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{job.candidatesCount} active candidates</span>
              </div>

              <a
                href="/pipeline"
                className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>View in Pipeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Open Requisition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white">Create Job Requisition</h2>

            <form onSubmit={handleCreateJob} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Title</label>
                <input
                  required
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Staff Security Engineer"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <select
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI Lab">AI Lab</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hiring Manager</label>
                  <input
                    type="text"
                    value={newJob.hiringManager}
                    onChange={(e) => setNewJob({ ...newJob, hiringManager: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Salary Min ($)</label>
                  <input
                    type="number"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob({ ...newJob, salaryMin: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Salary Max ($)</label>
                  <input
                    type="number"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob({ ...newJob, salaryMax: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role Description</label>
                <textarea
                  rows={3}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Outline responsibilities and key outcomes..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
                >
                  Create Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
