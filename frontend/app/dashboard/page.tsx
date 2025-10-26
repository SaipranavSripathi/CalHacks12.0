'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  Clock,
  FileText
} from 'lucide-react';

interface DashboardStats {
  totalApplications: number;
  totalInterviews: number;
  completedInterviews: number;
  acceptanceRate: number;
  avgTimeToInterview: number;
  topApplications: any[];
}

const STATUS_COLORS: Record<string, string> = {
  submitted: '#94a3b8',
  screened: '#3b82f6',
  invited: '#8b5cf6',
  interviewed: '#06b6d4',
  rejected: '#ef4444',
  accepted: '#10b981'
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  screened: 'Screened',
  invited: 'Invited',
  interviewed: 'Interviewed',
  rejected: 'Rejected',
  accepted: 'Accepted'
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      await fetchDashboardStats(user);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const fetchDashboardStats = async (user: any) => {
    try {
      const companyId = user.user_metadata?.company_id;
      if (!companyId) return;

      // Get all jobs for the company
      const { data: jobs } = await supabase
        .from('job')
        .select('job_id, title')
        .eq('company_id', companyId);

      if (!jobs || jobs.length === 0) {
        setStats({
          totalApplications: 0,
          totalInterviews: 0,
          completedInterviews: 0,
          acceptanceRate: 0,
          avgTimeToInterview: 0,
          topApplications: []
        });
        return;
      }

      const jobIds = jobs.map(j => j.job_id);

      // Get all applications
      const { data: applications } = await supabase
        .from('application')
        .select(`
          *,
          job:job_id (
            title,
            company_id
          )
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      const appIds = applications?.map(a => a.app_id) || [];

      // Get all interviews
      const { data: interviews } = await supabase
        .from('interview')
        .select('*')
        .in('app_id', appIds);

      // Calculate stats
      const totalApplications = applications?.length || 0;
      const totalInterviews = interviews?.length || 0;
      const completedInterviews = interviews?.filter(i => i.completed_at).length || 0;

      // Acceptance rate
      const acceptedCount = applications?.filter(a => a.status === 'accepted').length || 0;
      const acceptanceRate = totalApplications > 0 ? (acceptedCount / totalApplications) * 100 : 0;

      // Average time to interview in MINUTES (from application to interview start)
      const applicationsWithInterviews = applications?.filter(app => 
        interviews?.some(i => i.app_id === app.app_id)
      ) || [];
      
      let totalMinutes = 0;
      applicationsWithInterviews.forEach(app => {
        const interview = interviews?.find(i => i.app_id === app.app_id);
        if (interview) {
          const appDate = new Date(app.created_at);
          const interviewDate = new Date(interview.started_at);
          const minutes = Math.floor((interviewDate.getTime() - appDate.getTime()) / (1000 * 60));
          totalMinutes += minutes;
        }
      });
      const avgTimeToInterview = applicationsWithInterviews.length > 0 
        ? totalMinutes / applicationsWithInterviews.length 
        : 0;

      // Top applications - sorted by score (highest first), then by date (most recent first)
      const sortedApplications = [...(applications || [])].sort((a, b) => {
        // First sort by score (descending)
        if (a.score && b.score) {
          return b.score - a.score;
        }
        if (a.score && !b.score) return -1;
        if (!a.score && b.score) return 1;
        
        // If no scores or equal scores, sort by date (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setStats({
        totalApplications,
        totalInterviews,
        completedInterviews,
        acceptanceRate,
        avgTimeToInterview,
        topApplications: sortedApplications.slice(0, 10)
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2 leading-tight">Dashboard</h1>
            <p className="text-lg text-slate-600">Welcome back! Here's what's happening with your hiring.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Applications</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.totalApplications || 0}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Interviews</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stats?.totalInterviews || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">{stats?.completedInterviews || 0} completed</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Acceptance Rate</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.acceptanceRate ? stats.acceptanceRate.toFixed(1) : '0'}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">of applications</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Avg Time to Interview</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.avgTimeToInterview ? Math.round(stats.avgTimeToInterview).toLocaleString() : '0'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">minutes</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Applications */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Top Applications</h2>
              <p className="text-sm text-slate-500 mt-1">Sorted by highest score, then by most recent</p>
            </div>
            <div className="overflow-x-auto">
              {stats?.topApplications && stats.topApplications.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {stats.topApplications.map((app) => (
                      <tr key={app.app_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{app.name}</div>
                          <div className="text-sm text-slate-500">{app.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">{app.job?.title || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                            style={{
                              backgroundColor: `${STATUS_COLORS[app.status]}20`,
                              color: STATUS_COLORS[app.status]
                            }}
                          >
                            {STATUS_LABELS[app.status] || app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {app.score ? (
                            <span className="text-sm font-bold text-slate-900">{app.score.toFixed(1)}</span>
                          ) : (
                            <span className="text-sm text-slate-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>No applications yet</p>
                </div>
              )}
            </div>
          </div>    
        </div>
      </main>
    </div>
  );
}