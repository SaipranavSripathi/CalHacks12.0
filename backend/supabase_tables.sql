-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ==========================
-- 1️⃣ COMPANY
-- ==========================
create table if not exists public.company (
  company_id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- ==========================
-- 2️⃣ JOB
-- ==========================
create table if not exists public.job (
  job_id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.company(company_id) on delete cascade,
  title text not null,
  description text,
  required_skills text[],
  preferred_skills text[],
  created_at timestamptz default now()
);

-- ==========================
-- 3️⃣ RESUME
-- ==========================
create table if not exists public.resume (
  resume_id uuid primary key default uuid_generate_v4(),
  resume_url text not null,
  parsed_json jsonb,
  skills text[],
  anonymized_url text,
  created_at timestamptz default now()
);

-- ==========================
-- 4️⃣ APPLICATION
-- ==========================
create table if not exists public.application (
  app_id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.job(job_id) on delete cascade,
  resume_id uuid references public.resume(resume_id) on delete cascade,
  name text not null,
  email text not null,
  status text check (
    status in ('submitted', 'screened', 'invited', 'interviewed', 'rejected', 'accepted')
  ) default 'submitted',
  score numeric,
  rubric_score jsonb,
  rationale text,
  application_token uuid default uuid_generate_v4(),
  created_at timestamptz default now()
);

-- ==========================
-- 5️⃣ INTERVIEW
-- ==========================
create table if not exists public.interview (
  interview_id uuid primary key default uuid_generate_v4(),
  app_id uuid references public.application(app_id) on delete cascade,
  started_at timestamptz default now(),
  completed_at timestamptz,
  transcript text,
  video_url text,
  ai_score jsonb,
  created_at timestamptz default now()
);

-- ==========================
-- 6️⃣ AGENT
-- ==========================
create table if not exists public.agent (
  agent_id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interview(interview_id) on delete cascade,
  type text check (
    type in ('pro', 'con')
  ) not null,
  response text,
  round int default 1,
  created_at timestamptz default now()
);

-- ==========================
-- 7️⃣ SETTLING AGENT
-- ==========================
create table if not exists public.settling_agent (
  settle_id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interview(interview_id) on delete cascade,
  summary text,
  final_score numeric,
  recommendation text,
  created_at timestamptz default now()
);

-- ==========================
-- 8️⃣ INDEXES (for performance)
-- ==========================
create index if not exists idx_job_company_id on public.job(company_id);
create index if not exists idx_app_job_id on public.application(job_id);
create index if not exists idx_app_resume_id on public.application(resume_id);
create index if not exists idx_interview_app_id on public.interview(app_id);
create index if not exists idx_agent_interview_id on public.agent(interview_id);
create index if not exists idx_settle_interview_id on public.settling_agent(interview_id);
