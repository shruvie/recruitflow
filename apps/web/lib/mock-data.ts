import {
  JobStatus,
  EmploymentType,
  LocationType,
  Priority,
  CandidateStatus,
  CandidateSource,
  ApplicationStatus,
  RoleKey,
} from '@recruitflow/core';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: CandidateStatus;
  source: CandidateSource;
  stage: string;
  matchScore: number;
  skills: string[];
  experienceYears: number;
  location: string;
  appliedDate: string;
  avatarUrl: string;
  notes: string;
  summary: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  status: JobStatus;
  type: EmploymentType;
  locationType: LocationType;
  location: string;
  priority: Priority;
  salaryMin: number;
  salaryMax: number;
  candidatesCount: number;
  hiringManager: string;
  postedDate: string;
  description: string;
  requiredSkills: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  candidates: Candidate[];
}

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job_01',
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    status: JobStatus.OPEN,
    type: EmploymentType.FULL_TIME,
    locationType: LocationType.HYBRID,
    location: 'San Francisco, CA',
    priority: Priority.HIGH,
    salaryMin: 160000,
    salaryMax: 195000,
    candidatesCount: 14,
    hiringManager: 'Elena Vance (VP Eng)',
    postedDate: '2026-10-15',
    description: 'Lead architecture on our distributed recruitment platform using Next.js 15, NestJS, and PostgreSQL.',
    requiredSkills: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'Docker'],
  },
  {
    id: 'job_02',
    title: 'AI / ML Research Scientist',
    department: 'AI Lab',
    status: JobStatus.OPEN,
    type: EmploymentType.FULL_TIME,
    locationType: LocationType.REMOTE,
    location: 'Remote, US',
    priority: Priority.URGENT,
    salaryMin: 185000,
    salaryMax: 230000,
    candidatesCount: 8,
    hiringManager: 'Dr. Aris Thorne',
    postedDate: '2026-10-20',
    description: 'Design and deploy fine-tuned resume matching algorithms and agentic conversational tool architectures.',
    requiredSkills: ['PyTorch', 'Python', 'LLMs', 'Vector DBs', 'RAG'],
  },
  {
    id: 'job_03',
    title: 'Lead Product Designer',
    department: 'Design',
    status: JobStatus.OPEN,
    type: EmploymentType.FULL_TIME,
    locationType: LocationType.ONSITE,
    location: 'New York, NY',
    priority: Priority.MEDIUM,
    salaryMin: 140000,
    salaryMax: 175000,
    candidatesCount: 19,
    hiringManager: 'Sofia Martinez',
    postedDate: '2026-10-10',
    description: 'Craft intuitive, frictionless recruiting CRM experiences across web and mobile platforms.',
    requiredSkills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
  },
  {
    id: 'job_04',
    title: 'Senior DevOps / SRE',
    department: 'Infrastructure',
    status: JobStatus.PAUSED,
    type: EmploymentType.FULL_TIME,
    locationType: LocationType.REMOTE,
    location: 'Remote, Global',
    priority: Priority.LOW,
    salaryMin: 155000,
    salaryMax: 190000,
    candidatesCount: 5,
    hiringManager: 'Klaus Bauer',
    postedDate: '2026-09-28',
    description: 'Scale our Kubernetes multi-tenant infrastructure, Redis BullMQ queues, and automated CI pipelines.',
    requiredSkills: ['Kubernetes', 'Terraform', 'AWS', 'Redis', 'Observability'],
  },
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand_01',
    name: 'Sarah Chen',
    email: 'sarah.chen@techmail.io',
    phone: '+1 (415) 892-3321',
    role: 'Senior Full Stack Engineer',
    status: CandidateStatus.ACTIVE,
    source: CandidateSource.SOURCED,
    stage: 'Technical Interview',
    matchScore: 96,
    skills: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
    experienceYears: 7,
    location: 'San Francisco, CA',
    appliedDate: '2026-10-22',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    notes: 'Exceptional system design interview. Solved the distributed cache invalidation problem cleanly.',
    summary: 'Senior engineer with 7+ years building enterprise SaaS platforms at scale. Strong communicator with deep TypeScript expertise.',
  },
  {
    id: 'cand_02',
    name: 'Marcus Vance',
    email: 'marcus.vance@aiwork.dev',
    phone: '+1 (206) 441-9012',
    role: 'AI / ML Research Scientist',
    status: CandidateStatus.ACTIVE,
    source: CandidateSource.REFERRAL,
    stage: 'Offer',
    matchScore: 98,
    skills: ['Python', 'PyTorch', 'LLMs', 'Vector DBs', 'Embeddings'],
    experienceYears: 6,
    location: 'Seattle, WA',
    appliedDate: '2026-10-18',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    notes: 'Offer drafted at $215k base + equity. Strong match for our autonomous recruitment agent initiative.',
    summary: 'Published researcher in semantic search and RAG architecture. Built high-throughput embedding pipelines.',
  },
  {
    id: 'cand_03',
    name: 'Elena Rostova',
    email: 'elena.rostova@designlab.co',
    phone: '+1 (646) 332-8819',
    role: 'Lead Product Designer',
    status: CandidateStatus.ACTIVE,
    source: CandidateSource.APPLIED,
    stage: 'Screening',
    matchScore: 92,
    skills: ['Figma', 'Design Systems', 'Micro-interactions', 'Typography'],
    experienceYears: 8,
    location: 'New York, NY',
    appliedDate: '2026-10-27',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    notes: 'Portfolio review completed. High marks for design token architecture.',
    summary: 'Design systems lead who standardized multi-brand component libraries for fintech products.',
  },
  {
    id: 'cand_04',
    name: 'David Kim',
    email: 'david.kim@cloudinfra.org',
    phone: '+1 (312) 551-7782',
    role: 'Senior DevOps / SRE',
    status: CandidateStatus.ACTIVE,
    source: CandidateSource.JOB_BOARD,
    stage: 'Culture Fit',
    matchScore: 89,
    skills: ['Kubernetes', 'Terraform', 'Prometheus', 'AWS', 'Docker'],
    experienceYears: 5,
    location: 'Chicago, IL',
    appliedDate: '2026-10-24',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    notes: 'Very collaborative attitude, eager to modernize deployment automation.',
    summary: 'DevOps engineer focused on zero-downtime database migrations and multi-region failover.',
  },
  {
    id: 'cand_05',
    name: 'Priya Patel',
    email: 'priya.patel@englead.com',
    phone: '+1 (408) 772-9110',
    role: 'Senior Full Stack Engineer',
    status: CandidateStatus.ACTIVE,
    source: CandidateSource.SOURCED,
    stage: 'Sourced',
    matchScore: 94,
    skills: ['React', 'Node.js', 'PostgreSQL', 'GraphQL', 'TailwindCSS'],
    experienceYears: 6,
    location: 'Austin, TX',
    appliedDate: '2026-10-29',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    notes: 'Outreached on LinkedIn. Expressed excitement for AI-native ATS space.',
    summary: 'Full stack product engineer with strong track record in customer-facing collaboration tools.',
  },
  {
    id: 'cand_06',
    name: 'James Wilson',
    email: 'james.wilson@frontendcraft.io',
    phone: '+1 (617) 229-3381',
    role: 'Senior Full Stack Engineer',
    status: CandidateStatus.ACTIVE,
    source: CandidateSource.REFERRAL,
    stage: 'Hired',
    matchScore: 97,
    skills: ['TypeScript', 'Next.js', 'Tailwind', 'REST APIs', 'Jest'],
    experienceYears: 9,
    location: 'Boston, MA',
    appliedDate: '2026-10-05',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    notes: 'Offer accepted! Starting Nov 15th.',
    summary: 'Proven tech lead with experience scaling engineering teams from Series A to C.',
  },
];

export const PIPELINE_STAGES = [
  { id: 'sourced', name: 'Sourced', color: 'border-slate-500/30' },
  { id: 'screening', name: 'Screening', color: 'border-blue-500/30' },
  { id: 'technical', name: 'Technical Interview', color: 'border-purple-500/30' },
  { id: 'culture', name: 'Culture Fit', color: 'border-amber-500/30' },
  { id: 'offer', name: 'Offer', color: 'border-emerald-500/30' },
  { id: 'hired', name: 'Hired', color: 'border-green-600/40' },
];

export const RECENT_ACTIVITIES = [
  {
    id: 'act_01',
    type: 'STAGE_MOVED',
    candidateName: 'Marcus Vance',
    role: 'AI / ML Research Scientist',
    detail: 'Advanced to Offer stage with 98% AI Match Score',
    time: '25 minutes ago',
    icon: 'TrendingUp',
  },
  {
    id: 'act_02',
    type: 'AI_MATCH',
    candidateName: 'Sarah Chen',
    role: 'Senior Full Stack Engineer',
    detail: 'AI Copilot parsed resume: Identified strong PostgreSQL & Next.js synergy',
    time: '2 hours ago',
    icon: 'Sparkles',
  },
  {
    id: 'act_03',
    type: 'INTERVIEW_SCHEDULED',
    candidateName: 'Elena Rostova',
    role: 'Lead Product Designer',
    detail: 'Portfolio deep dive scheduled for Nov 2, 2:00 PM EST',
    time: '4 hours ago',
    icon: 'Calendar',
  },
  {
    id: 'act_04',
    type: 'OFFER_ACCEPTED',
    candidateName: 'James Wilson',
    role: 'Senior Full Stack Engineer',
    detail: 'Offer accepted ($185,000 + 0.15% equity)',
    time: 'Yesterday',
    icon: 'CheckCircle2',
  },
];
