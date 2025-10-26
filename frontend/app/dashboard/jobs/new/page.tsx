'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Job, CreateJobDto } from '@/types/job';

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateJobDto>({
    title: '',
    description: '',
    required_skills: [],
    preferred_skills: [],
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [skillType, setSkillType] = useState<'required' | 'preferred'>('required');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get the company ID for the current user
      const { data: companyData, error: companyError } = await supabase
        .from('company')
        .select('company_id')
        .eq('email', user.email)
        .single();

      if (companyError || !companyData) {
        throw new Error('Company not found. Please contact support.');
      }

      const { error } = await supabase
        .from('job')
        .insert([
          {
            ...formData,
            company_id: companyData.company_id,
          },
        ]);

      if (error) throw error;

      // Redirect to jobs list after successful creation
      router.push('/dashboard/jobs');
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the job.');
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (!currentSkill.trim()) return;

    const skill = currentSkill.trim();
    const skillField = `${skillType}_skills` as keyof CreateJobDto;
    
    if (!formData[skillField].includes(skill)) {
      setFormData(prev => ({
        ...prev,
        [skillField]: [...prev[skillField], skill],
      }));
    }
    
    setCurrentSkill('');
  };

  const removeSkill = (type: 'required' | 'preferred', index: number) => {
    const skillField = `${type}_skills` as keyof CreateJobDto;
    setFormData(prev => ({
      ...prev,
      [skillField]: prev[skillField].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Post a New Job</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below to create a new job listing.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Job Title *
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Job Description *
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              rows={6}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter a detailed job description..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Skills
              </label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    id="required"
                    name="skill-type"
                    type="radio"
                    checked={skillType === 'required'}
                    onChange={() => setSkillType('required')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="required" className="ml-2 block text-sm text-gray-700">
                    Required
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="preferred"
                    name="skill-type"
                    type="radio"
                    checked={skillType === 'preferred'}
                    onChange={() => setSkillType('preferred')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <label htmlFor="preferred" className="ml-2 block text-sm text-gray-700">
                    Preferred
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={`Add ${skillType} skill...`}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {formData.required_skills.map((skill, index) => (
                  <span
                    key={`required-${index}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('required', index)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:outline-none"
                    >
                      <span className="sr-only">Remove skill</span>
                      <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                      </svg>
                    </button>
                  </span>
                ))}
                {formData.required_skills.length === 0 && (
                  <p className="text-sm text-gray-500">No required skills added yet.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Skills</h3>
              <div className="flex flex-wrap gap-2">
                {formData.preferred_skills.map((skill, index) => (
                  <span
                    key={`preferred-${index}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill('preferred', index)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                    >
                      <span className="sr-only">Remove skill</span>
                      <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                      </svg>
                    </button>
                  </span>
                ))}
                {formData.preferred_skills.length === 0 && (
                  <p className="text-sm text-gray-500">No preferred skills added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/jobs')}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
}