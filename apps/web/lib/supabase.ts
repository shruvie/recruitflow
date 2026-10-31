import { createClient } from '@supabase/supabase-js';
import { INITIAL_CANDIDATES, INITIAL_JOBS, Candidate, Job } from './mock-data';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
  );
};

// Create client instance (or dummy instance if not yet configured)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

/**
 * Fetch candidates from Supabase with graceful fallback to initial demo pool
 */
export async function getCandidates(): Promise<Candidate[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_CANDIDATES;
  }

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*, applications(stage_id, score, pipeline_stages(name))')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch candidates fallback:', error?.message);
      return INITIAL_CANDIDATES;
    }

    return data.map((c: any) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone || '+1 (555) 019-2831',
      role: c.current_title || 'Software Engineer',
      status: c.status,
      source: c.source,
      stage: c.applications?.[0]?.pipeline_stages?.name || 'Sourced',
      matchScore: c.applications?.[0]?.score || 90,
      skills: ['TypeScript', 'React', 'PostgreSQL'],
      experienceYears: Number(c.years_of_experience) || 5,
      location: c.location || 'Remote',
      appliedDate: c.created_at ? c.created_at.split('T')[0] : '2026-10-31',
      avatarUrl: c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      notes: c.summary || 'Profile synced from Supabase.',
      summary: c.summary || 'Candidate profile synced via Supabase connection.',
    }));
  } catch (err) {
    console.error('Error querying Supabase:', err);
    return INITIAL_CANDIDATES;
  }
}

/**
 * Fetch jobs from Supabase with graceful fallback
 */
export async function getJobs(): Promise<Job[]> {
  if (!isSupabaseConfigured()) {
    return INITIAL_JOBS;
  }

  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return INITIAL_JOBS;
    }

    return data.map((j: any) => ({
      id: j.id,
      title: j.title,
      department: j.department,
      status: j.status,
      type: j.employment_type,
      locationType: j.location_type,
      location: j.location,
      priority: j.priority,
      salaryMin: Number(j.salary_min) || 120000,
      salaryMax: Number(j.salary_max) || 160000,
      candidatesCount: 5,
      hiringManager: 'Elena Vance',
      postedDate: j.created_at ? j.created_at.split('T')[0] : '2026-10-31',
      description: j.description_md || 'Position open at Acme Tech Corp.',
      requiredSkills: ['TypeScript', 'System Design'],
    }));
  } catch (err) {
    console.error('Error querying Supabase jobs:', err);
    return INITIAL_JOBS;
  }
}
