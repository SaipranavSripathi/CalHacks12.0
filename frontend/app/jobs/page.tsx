'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showApplication, setShowApplication] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    resume: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const jobsPerPage = 10;
  const router = useRouter();
  

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job')
        .select('*, company(company_name)');

      if (error) throw error;
      
      const formattedJobs = data.map(job => ({
        ...job,
        company_name: job.company?.company_name,
      }));
      
      setJobs(formattedJobs);
      if (formattedJobs.length > 0) {
        setSelectedJob(formattedJobs[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.required_skills?.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setShowApplication(false);
    setSubmitSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setApplicationForm({ ...applicationForm, resume: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { name, email, resume } = applicationForm;
      if (!resume) throw new Error("Please upload a resume");

      // 1️⃣ Insert a new application row in Supabase first
      const { data: insertedApp, error: insertError } = await supabase
        .from("application")
        .insert([
          {
            job_id: selectedJob?.job_id,
            name,
            email,
            status: "submitted",
          },
        ])
        .select()
        .single();
        

      if (insertError) throw insertError;
      console.log("✅ Inserted application:", insertedApp);

      // 2️⃣ Upload the resume to your backend (include app_id so backend can update record if needed)
      const formData = new FormData();
      formData.append("app_id", insertedApp.app_id); // useful for backend linking
      formData.append("job_id", selectedJob?.job_id || "");
      formData.append("job_description", selectedJob?.description || "");
      formData.append("name", name);
      formData.append("email", email);
      formData.append("resume", resume);

      const response = await fetch("http://localhost:5001/upload_resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Resume upload failed: ${response.status} - ${text}`);
      }

      const { resume_url } = await response.json();

      // 3️⃣ (Optional) Update the application row with resume URL
      const { error: updateError } = await supabase
        .from("application")
        .update({ resume: resume_url })
        .eq("app_id", insertedApp.app_id);

      if (updateError) throw updateError;

      // 4️⃣ Success: reset form
      setSubmitSuccess(true);
      setApplicationForm({ name: "", email: "", resume: null });
    } catch (err: any) {
      console.error("Error submitting application:", err);
      alert(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3 h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {currentJobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">No jobs found</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {searchTerm ? 'Try adjusting your search.' : 'No job openings available.'}
                </p>
              </div>
            ) : (
              currentJobs.map((job) => (
                <button
                  key={job.job_id}
                  onClick={() => handleJobClick(job)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedJob?.job_id === job.job_id
                      ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <h3 className={`font-semibold text-lg mb-1 ${
                    selectedJob?.job_id === job.job_id ? 'text-indigo-700' : 'text-slate-900'
                  }`}>
                    {job.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">{job.company_name}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
            
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {selectedJob ? (
              <div className="bg-white rounded-xl shadow-sm h-[calc(100vh-200px)] overflow-y-auto">
                {!showApplication && !submitSuccess ? (
                  <div className="p-8">
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold text-slate-900 mb-3">{selectedJob.title}</h1>
                      <div className="flex items-center gap-4 text-slate-600 mb-4">
                        <span className="font-medium">{selectedJob.company_name}</span>
                      </div>
                      <Button
                        onClick={() => setShowApplication(true)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                      >
                        Apply Now
                      </Button>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <h2 className="text-lg font-semibold text-slate-900 mb-4">About the job</h2>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {selectedJob.description || 'No description provided.'}
                        </p>
                      </div>

                      {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-semibold text-slate-900 mb-3">Required Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedJob.required_skills.map((skill, index) => (
                              <span
                                key={`${selectedJob.job_id}-skill-${index}`}
                                className="px-3 py-1.5 text-sm font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : submitSuccess ? (
                  <div className="p-8">
                    <div className="rounded-xl bg-green-50 border border-green-200 p-6">
                      <div className="flex gap-4">
                        <svg className="h-6 w-6 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 text-lg">Application submitted!</h3>
                          <p className="mt-2 text-green-700">
                            Thank you for applying to {selectedJob.title}. We'll review your application and get back to you soon.
                          </p>
                          <div className="mt-6 flex gap-3">
                            <Button
                              onClick={() => {
                                setSubmitSuccess(false);
                                setShowApplication(false);
                              }}
                              variant="outline"
                              className="border-green-600 text-green-700 hover:bg-green-50"
                            >
                              Back to job
                            </Button>
                            <Button
                              onClick={() => {
                                setSubmitSuccess(false);
                                setShowApplication(true);
                                setApplicationForm({ name: '', email: '', resume: null });
                              }}
                              variant="outline"
                              className="border-green-600 text-green-700 hover:bg-green-50"
                            >
                              Apply to another job
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <button
                      onClick={() => setShowApplication(false)}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 group"
                    >
                      <svg className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to job details
                    </button>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Apply for {selectedJob.title}</h2>
                    <p className="text-slate-600 mb-6">at {selectedJob.company_name}</p>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name</Label>
                        <Input
                          id="name"
                          type="text"
                          required
                          value={applicationForm.name}
                          onChange={(e) => setApplicationForm({ ...applicationForm, name: e.target.value })}
                          placeholder="John Doe"
                          className="mt-2 h-12 rounded-lg border-slate-300"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={applicationForm.email}
                          onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                          placeholder="john.doe@example.com"
                          className="mt-2 h-12 rounded-lg border-slate-300"
                        />
                      </div>

                      <div>
                        <Label htmlFor="resume" className="text-sm font-semibold text-slate-700">Resume</Label>
                        <Input
                          id="resume"
                          type="file"
                          required
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="mt-2 h-12 rounded-lg border-slate-300"
                        />
                        <p className="mt-2 text-sm text-slate-500">PDF, DOC, or DOCX (Max 5MB)</p>
                        {applicationForm.resume && (
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            Selected: {applicationForm.resume.name}
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full h-12 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Application'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center p-8">
                  <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-slate-900">Select a job to view details</h3>
                  <p className="mt-2 text-slate-500">Click on any job from the list to see more information</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}