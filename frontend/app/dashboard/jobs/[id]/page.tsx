'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Briefcase, Calendar } from 'lucide-react';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [job, setJob] = useState<Job | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobId || jobId === 'new') {
      setLoading(false);
      return;
    }

    fetchJob(jobId);
  }, [jobId]);

  const fetchJob = async (id: string) => {
    try {
      setLoading(true);
      
      const { data: jobData, error: jobError } = await supabase
        .from('job')
        .select(`
          *,
          company (
            company_id,
            company_name,
            email
          )
        `)
        .eq('job_id', id)
        .single();

      if (jobError) throw jobError;
      if (!jobData) throw new Error('Job not found');

      setJob(jobData);
      
      const { data: companyJobs, error: jobsError } = await supabase
        .from('job')
        .select('*')
        .eq('company_id', jobData.company.company_id)
        .neq('job_id', id);

      if (jobsError) throw jobsError;
      
      setRelatedJobs(companyJobs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job')
        .delete()
        .eq('job_id', jobId);

      if (error) throw error;
      
      router.push('/dashboard/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to delete job');
      console.error('Error deleting job:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-slate-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto py-8 px-6 lg:px-8">
          <div className="bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Error</h3>
                <p className="text-sm text-slate-600">{error || 'Failed to load job details'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto py-8 px-6 lg:px-8">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight">
                  {job.title}
                </h1>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <p className="text-sm">
                    Posted on {new Date(job.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/jobs/${job.job_id}/edit`}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 transition-all hover:shadow-lg hover:shadow-red-500/30"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Company
                </h3>
                <p className="text-slate-900">{job.company_name}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </h3>
                <p className="text-slate-900 whitespace-pre-line leading-relaxed">
                  {job.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills?.length ? (
                    job.required_skills.map((skill, index) => (
                      <span 
                        key={`required-${index}`} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600">No required skills specified</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Preferred Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills?.length ? (
                    job.preferred_skills.map((skill, index) => (
                      <span 
                        key={`preferred-${index}`} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600">No preferred skills specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Other Open Positions</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedJobs.map((relatedJob) => (
                <div 
                  key={relatedJob.job_id} 
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {relatedJob.title}
                        </h3>
                        <p className="text-sm text-slate-600 truncate">{relatedJob.company_name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                      {relatedJob.description}
                    </p>
                    <Link
                      href={`/dashboard/jobs/${relatedJob.job_id}`}
                      className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      View details
                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}