-- ============================================================================
-- RecruitFlow — Supabase PostgreSQL Schema & Seed Script
-- Architecture Reference: docs/database.md & docs/architecture.md
-- ============================================================================
-- Instructions:
-- 1. Open your Supabase Project: https://supabase.com/dashboard
-- 2. Go to the "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'FILLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE candidate_status AS ENUM ('ACTIVE', 'ARCHIVED', 'DO_NOT_CONTACT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE candidate_source AS ENUM ('APPLIED', 'REFERRAL', 'SOURCED', 'AGENCY', 'JOB_BOARD', 'EVENT', 'IMPORT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('ACTIVE', 'HIRED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stage_type AS ENUM ('OPEN', 'OFFER', 'HIRED', 'REJECTED', 'ON_HOLD', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interview_type AS ENUM ('PHONE', 'VIDEO', 'TECHNICAL', 'HR', 'BEHAVIORAL', 'PANEL', 'ONSITE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE feedback_recommendation AS ENUM ('STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE', 'STRONG_NO_HIRE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE email_status AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'BOUNCED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. CORE TABLES

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug CITEXT UNIQUE NOT NULL,
    domain TEXT,
    logo_url TEXT,
    plan TEXT NOT NULL DEFAULT 'ENTERPRISE',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    email CITEXT NOT NULL,
    full_name TEXT NOT NULL,
    title TEXT,
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'ACTIVE',
    auth_subject TEXT UNIQUE, -- maps to Supabase auth.users.id
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_users_org_email UNIQUE (organization_id, email)
);

-- Permissions Catalog (Global)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL, -- e.g. "candidate.read", "job.write"
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    is_destructive BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT
);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_org_key UNIQUE (organization_id, key)
);

-- Role Permissions Join
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Skills Lookup
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug CITEXT NOT NULL,
    category TEXT,
    CONSTRAINT uq_skills_org_slug UNIQUE (organization_id, slug)
);

-- Tags Lookup
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug CITEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    CONSTRAINT uq_tags_org_slug UNIQUE (organization_id, slug)
);

-- Pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    type stage_type NOT NULL DEFAULT 'OPEN',
    position INT NOT NULL,
    sla_days INT,
    is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs / Requisitions
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug CITEXT NOT NULL,
    description_md TEXT,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    location_type location_type NOT NULL DEFAULT 'HYBRID',
    employment_type employment_type NOT NULL DEFAULT 'FULL_TIME',
    status job_status NOT NULL DEFAULT 'OPEN',
    priority priority_level NOT NULL DEFAULT 'MEDIUM',
    openings INT NOT NULL DEFAULT 1,
    experience_min_years INT DEFAULT 0,
    experience_max_years INT,
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency CHAR(3) DEFAULT 'USD',
    salary_period TEXT DEFAULT 'YEARLY',
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
    hiring_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_jobs_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email CITEXT NOT NULL,
    phone TEXT,
    location TEXT,
    avatar_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    current_company TEXT,
    current_title TEXT,
    years_of_experience NUMERIC(4, 1) DEFAULT 0,
    expected_salary NUMERIC(12, 2),
    expected_salary_currency CHAR(3) DEFAULT 'USD',
    notice_period_days INT DEFAULT 30,
    source candidate_source NOT NULL DEFAULT 'APPLIED',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status candidate_status NOT NULL DEFAULT 'ACTIVE',
    summary TEXT,
    search_vector TSVECTOR,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Candidate Skills
CREATE TABLE IF NOT EXISTS candidate_skills (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    PRIMARY KEY (candidate_id, skill_id)
);

-- Rejection Reasons Lookup
CREATE TABLE IF NOT EXISTS rejection_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT NOT NULL,
    category TEXT
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE RESTRICT,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    status application_status NOT NULL DEFAULT 'ACTIVE',
    source candidate_source DEFAULT 'APPLIED',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    score INT CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    screening_answers JSONB DEFAULT '{}'::jsonb,
    cover_letter TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    rejection_reason_id UUID REFERENCES rejection_reasons(id) ON DELETE SET NULL,
    rejection_note TEXT,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_app_candidate_job UNIQUE (organization_id, candidate_id, job_id)
);

-- Application Stage History (Audit / Analytics)
CREATE TABLE IF NOT EXISTS application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    to_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    moved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type TEXT NOT NULL DEFAULT 'USER',
    seconds_in_from_stage INT DEFAULT 0,
    note TEXT,
    moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interviews
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type interview_type NOT NULL DEFAULT 'VIDEO',
    status interview_status NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    timezone TEXT DEFAULT 'UTC',
    location TEXT,
    meeting_url TEXT,
    cancellation_reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rescheduled_from TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interview Participants
CREATE TABLE IF NOT EXISTS interview_participants (
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'INTERVIEWER',
    response TEXT NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (interview_id, user_id)
);

-- Interview Feedback / Scorecards
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    technical_score INT CHECK (technical_score BETWEEN 1 AND 5),
    communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
    problem_solving_score INT CHECK (problem_solving_score BETWEEN 1 AND 5),
    culture_fit_score INT CHECK (culture_fit_score BETWEEN 1 AND 5),
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    recommendation feedback_recommendation NOT NULL DEFAULT 'HIRE',
    comments TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_interview_interviewer UNIQUE (interview_id, interviewer_id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    due_at TIMESTAMPTZ,
    priority priority_level NOT NULL DEFAULT 'MEDIUM',
    status TEXT NOT NULL DEFAULT 'TODO',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities Feed (UI)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type TEXT NOT NULL DEFAULT 'USER',
    verb TEXT NOT NULL, -- e.g. "moved_stage", "created_job", "submitted_feedback"
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    subject_entity_type TEXT,
    subject_entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    context JSONB DEFAULT '{}'::jsonb,
    model TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- "USER", "ASSISTANT", "TOOL"
    content TEXT NOT NULL,
    tool_calls JSONB,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost_micros INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SEARCH TRIGGER FOR CANDIDATES
CREATE OR REPLACE FUNCTION update_candidate_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.email, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.current_title, '') || ' ' || coalesce(NEW.current_company, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_candidate_search_vector ON candidates;
CREATE TRIGGER trg_candidate_search_vector
BEFORE INSERT OR UPDATE OF first_name, last_name, email, current_title, current_company, summary
ON candidates
FOR EACH ROW EXECUTE FUNCTION update_candidate_search_vector();

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_candidates_org_created ON candidates (organization_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_org_email ON candidates (organization_id, email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_candidates_search_vector ON candidates USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs (organization_id, status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_kanban ON applications (organization_id, job_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications (organization_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_stage_history_funnel ON application_stage_history (organization_id, to_stage_id, moved_at);
CREATE INDEX IF NOT EXISTS idx_activities_feed ON activities (organization_id, occurred_at DESC);

-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- In Supabase, queries authenticated by users run under their authenticated role.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: get the organization_id of current authenticated user
CREATE OR REPLACE FUNCTION current_user_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE auth_subject = auth.uid()::text OR id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Permissive policy for Anon/Demo & Authenticated users
CREATE POLICY p_org_all ON organizations FOR ALL USING (true);
CREATE POLICY p_users_all ON users FOR ALL USING (true);
CREATE POLICY p_jobs_all ON jobs FOR ALL USING (true);
CREATE POLICY p_candidates_all ON candidates FOR ALL USING (true);
CREATE POLICY p_applications_all ON applications FOR ALL USING (true);
CREATE POLICY p_pipelines_all ON pipelines FOR ALL USING (true);
CREATE POLICY p_stages_all ON pipeline_stages FOR ALL USING (true);
CREATE POLICY p_activities_all ON activities FOR ALL USING (true);
CREATE POLICY p_ai_conv_all ON ai_conversations FOR ALL USING (true);
CREATE POLICY p_ai_msg_all ON ai_messages FOR ALL USING (true);

-- ============================================================================
-- 7. INITIAL SEED DATA
-- ============================================================================

-- A. Demo Organization
INSERT INTO organizations (id, name, slug, domain, plan)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Acme Tech Corp', 'acme-tech', 'acmetech.io', 'ENTERPRISE')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- B. Default System Roles
INSERT INTO roles (id, organization_id, key, name, is_system)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'SUPER_ADMIN', 'Super Administrator', true),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ORG_ADMIN', 'Organization Administrator', true),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'RECRUITER', 'Lead Recruiter', true),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'HIRING_MANAGER', 'Hiring Manager', true)
ON CONFLICT (organization_id, key) DO NOTHING;

-- C. Demo Users
INSERT INTO users (id, organization_id, email, full_name, title, status)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'shruvie@acmetech.io', 'Shruvie', 'Head of Talent & Platform Admin', 'ACTIVE'),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'elena.vance@acmetech.io', 'Elena Vance', 'VP of Engineering', 'ACTIVE'),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'aris.thorne@acmetech.io', 'Dr. Aris Thorne', 'AI Research Lead', 'ACTIVE')
ON CONFLICT (organization_id, email) DO NOTHING;

-- D. Standard Pipeline & Stages
INSERT INTO pipelines (id, organization_id, name, is_default)
VALUES 
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Standard Engineering Pipeline', true)
ON CONFLICT DO NOTHING;

INSERT INTO pipeline_stages (id, organization_id, pipeline_id, name, key, type, position)
VALUES 
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Sourced', 'SOURCED', 'OPEN', 1),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Screening', 'SCREENING', 'OPEN', 2),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Technical Interview', 'TECHNICAL', 'OPEN', 3),
    ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Culture Fit', 'CULTURE', 'OPEN', 4),
    ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Offer', 'OFFER', 'OFFER', 5),
    ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Hired', 'HIRED', 'HIRED', 6)
ON CONFLICT DO NOTHING;

-- E. Initial Requisitions / Jobs
INSERT INTO jobs (id, organization_id, title, slug, department, location, location_type, employment_type, status, priority, salary_min, salary_max, pipeline_id, hiring_manager_id, description_md)
VALUES 
    ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Senior Full Stack Engineer', 'senior-full-stack-engineer', 'Engineering', 'San Francisco, CA', 'HYBRID', 'FULL_TIME', 'OPEN', 'HIGH', 160000, 195000, '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Architect and scale our multi-tenant Next.js & NestJS recruitment platform.'),
    ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'AI / ML Research Scientist', 'ai-ml-research-scientist', 'AI Lab', 'Remote, US', 'REMOTE', 'FULL_TIME', 'OPEN', 'URGENT', 185000, 230000, '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Deploy semantic candidate matching vectors and autonomous AI interview scoring agents.'),
    ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Lead Product Designer', 'lead-product-designer', 'Design', 'New York, NY', 'ONSITE', 'FULL_TIME', 'OPEN', 'MEDIUM', 140000, 175000, '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Own design system tokens and delightful recruiter workflow experiences.')
ON CONFLICT DO NOTHING;

-- F. Initial Candidates
INSERT INTO candidates (id, organization_id, first_name, last_name, email, phone, location, current_company, current_title, years_of_experience, source, status, summary, avatar_url)
VALUES 
    ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sarah', 'Chen', 'sarah.chen@techmail.io', '+1 (415) 892-3321', 'San Francisco, CA', 'Stripe', 'Senior Staff Software Engineer', 7.5, 'SOURCED', 'ACTIVE', 'Deep expertise in distributed Next.js and PostgreSQL multi-tenant isolation.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Marcus', 'Vance', 'marcus.vance@aiwork.dev', '+1 (206) 441-9012', 'Seattle, WA', 'OpenAI Fellow', 'Research Fellow', 6.0, 'REFERRAL', 'ACTIVE', 'Published author in embedding models, vector retrieval, and LLM safety.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Elena', 'Rostova', 'elena.rostova@designlab.co', '+1 (646) 332-8819', 'New York, NY', 'Figma Systems', 'Senior Product Designer', 8.0, 'APPLIED', 'ACTIVE', 'Created award-winning enterprise design token architectures and UI frameworks.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80')
ON CONFLICT DO NOTHING;

-- G. Candidate Applications
INSERT INTO applications (id, organization_id, candidate_id, job_id, pipeline_id, stage_id, status, score, source)
VALUES 
    ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'ACTIVE', 96, 'SOURCED'),
    ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'ACTIVE', 98, 'REFERRAL'),
    ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'ACTIVE', 92, 'APPLIED')
ON CONFLICT (organization_id, candidate_id, job_id) DO NOTHING;
