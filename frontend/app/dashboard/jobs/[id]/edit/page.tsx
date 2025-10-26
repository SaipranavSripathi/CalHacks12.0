'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Job, UpdateJobDto } from '@/types/job';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function EditJobPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UpdateJobDto>({
    title: '',
    description: '',
    required_skills: [],
    preferred_skills: [],
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [skillType, setSkillType] = useState<'required' | 'preferred'>('required');

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    // Set initial height when data loads
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (textarea && formData.description) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [formData.description]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('job')
        .select('*')
        .eq('job_id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Job not found');

      setFormData({
        title: data.title,
        description: data.description || '',
        required_skills: data.required_skills || [],
        preferred_skills: data.preferred_skills || [],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load job');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('job')
        .update(formData)
        .eq('job_id', id);

      if (error) throw error;
      
      router.push('/dashboard/jobs');
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the job.');
      console.error('Error updating job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (!currentSkill.trim()) return;

    const skill = currentSkill.trim();
    const skillField = `${skillType}_skills` as keyof UpdateJobDto;
    
    if (!formData[skillField]?.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        [skillField]: [...(prev[skillField] || []), skill],
      }));
    }
    
    setCurrentSkill('');
  };

  const removeSkill = (type: 'required' | 'preferred', index: number) => {
    const skillField = `${type}_skills` as keyof UpdateJobDto;
    setFormData(prev => ({
      ...prev,
      [skillField]: (Array.isArray(prev[skillField]) ? prev[skillField] : []).filter((_, i) => i !== index),
    }));
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 leading-tight">Edit Job Posting</h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Update the job details below.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-white border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Error</h3>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
              Job Description *
            </label>
            <textarea
              id="description"
              rows={6}
              required
              value={formData.description}
              onChange={handleTextareaChange}
              className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 resize-none overflow-hidden"
              placeholder="Enter a detailed job description..."
              style={{ minHeight: '150px' }}
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Add Skills
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={skillType === 'required'}
                      onChange={() => setSkillType('required')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="ml-2 text-sm text-slate-700 font-medium">Required</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={skillType === 'preferred'}
                      onChange={() => setSkillType('preferred')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="ml-2 text-sm text-slate-700 font-medium">Preferred</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
                  placeholder={`Add ${skillType} skill...`}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="inline-flex items-center px-6 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.required_skills?.map((skill, index) => (
                    <span
                      key={`required-${index}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill('required', index)}
                        className="inline-flex items-center justify-center hover:bg-red-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {!formData.required_skills?.length && (
                    <p className="text-sm text-slate-500 italic">No required skills added yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Preferred Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.preferred_skills?.map((skill, index) => (
                    <span
                      key={`preferred-${index}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill('preferred', index)}
                        className="inline-flex items-center justify-center hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {!formData.preferred_skills?.length && (
                    <p className="text-sm text-slate-500 italic">No preferred skills added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/jobs')}
              className="px-6 py-2.5 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}