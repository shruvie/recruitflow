'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  Sparkles,
  Users,
  Key,
  Check,
  Save,
  Database,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { RoleKey } from '@recruitflow/core';
import { isSupabaseConfigured } from '../../../lib/supabase';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState('Acme Tech Corp');
  const [tenantId] = useState('org_acme_prod_01');
  const [aiModel, setAiModel] = useState('claude-3-5-sonnet-20241022');
  const [temperature, setTemperature] = useState(0.2);
  const [isSaved, setIsSaved] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  useEffect(() => {
    setIsDbConnected(isSupabaseConfigured());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">Organization & Settings</h1>
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
            Tenant Configuration
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Manage multi-tenant isolation, AI provider parameters, and role-based access control.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tenant Isolation Panel */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Architecture & Isolation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tenant Context ID (Immutable)
              </label>
              <input
                disabled
                type="text"
                value={tenantId}
                className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-800/60 rounded-lg text-xs text-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Four-Layer Tenant Isolation Active</p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Every query is automatically scoped with TenantContext, validated via Prisma client extensions and PostgreSQL Row-Level Security policies.
              </p>
            </div>
          </div>
        </div>

        {/* Supabase Cloud Database Integration Panel */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase Cloud Database Connection</span>
            </div>
            {isDbConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected & Live</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Awaiting Supabase Keys</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            RecruitFlow is ready to sync live with your Supabase PostgreSQL database. All tables, custom enums, indexes, and full-text search triggers are defined in <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[11px]">supabase_schema.sql</code>.
          </p>

          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-200">How to connect your Supabase project:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Open your project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li>Go to <strong>SQL Editor</strong>, paste and run the provided <code className="text-slate-300">supabase_schema.sql</code> script.</li>
              <li>Go to <strong>Project Settings → API</strong> and copy your Project URL & anon key.</li>
              <li>Add them to your environment variables (<code className="text-slate-300">.env</code> and Vercel Project Settings):</li>
            </ol>
            <div className="p-2.5 bg-black/60 rounded font-mono text-[10px] text-emerald-300 border border-slate-800 space-y-0.5">
              <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...</div>
            </div>
          </div>
        </div>

        {/* AI Provider Config */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>AI Orchestrator Engine Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Primary LLM Driver</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet (Recommended)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Fallback)</option>
                <option value="local-ollama">Local Llama 3 70B (Air-Gapped)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-violet-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Lower temperature ensures factual candidate scoring</span>
            </div>
          </div>
        </div>

        {/* Roles & Access Matrix */}
        <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-slate-200 block">{RoleKey.ORG_ADMIN}</span>
              <span className="text-[10px] text-slate-400">Full tenant control</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-slate-200 block">{RoleKey.RECRUITER}</span>
              <span className="text-[10px] text-slate-400">Candidates & Pipelines</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-slate-200 block">{RoleKey.HIRING_MANAGER}</span>
              <span className="text-[10px] text-slate-400">Own requisitions</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-slate-200 block">{RoleKey.INTERVIEWER}</span>
              <span className="text-[10px] text-slate-400">Submit scorecard</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end items-center gap-3">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Changes saved
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
