'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Kanban,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  Building2,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const NAV_ITEMS: NavSection[] = [
  { group: 'RECRUITMENT', items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Candidates', href: '/candidates', icon: Users, badge: '24' },
    { label: 'Jobs', href: '/jobs', icon: Briefcase, badge: '4' },
    { label: 'Pipeline', href: '/pipeline', icon: Kanban },
  ]},
  { group: 'INTELLIGENCE', items: [
    { label: 'AI Assistant', href: '/assistant', icon: Sparkles, highlight: true },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]},
  { group: 'PLATFORM', items: [
    { label: 'Settings', href: '/settings', icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0B0F19] border-r border-slate-800/80 flex flex-col h-screen select-none">
      {/* Brand & Organization */}
      <div className="p-4 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-base tracking-tight">RecruitFlow</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise ATS & CRM</p>
          </div>
        </div>

        {/* Tenant Switcher dropdown */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition text-left"
          title="Tenant Isolation: Acme Technologies (Tenant ID: org_acme_01)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-200 truncate">Acme Tech Corp</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_ITEMS.map((section) => (
          <div key={section.group}>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              {section.group}
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : item.highlight
                        ? 'text-violet-300 hover:bg-violet-950/30 hover:text-violet-200 border border-transparent'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-emerald-400'
                            : item.highlight
                            ? 'text-violet-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300 font-semibold">
                        {item.badge}
                      </span>
                    )}
                    {item.highlight && !isActive && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Tenant Isolation Guard status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px] mb-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tenant RLS</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            STRICT
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
            SV
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">Shruvie</p>
            <p className="text-[10px] text-slate-400 truncate">ORG_ADMIN</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
