"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/types/job"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PublicJobPage() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [applicationForm, setApplicationForm] = useState({
    name: "",
    email: "",
    resume: null as File | null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("description")

  useEffect(() => {
    if (id) {
      fetchJob(Array.isArray(id) ? id[0] : id)
    } else {
      setError("No job ID provided")
      setLoading(false)
    }
  }, [id])

  const fetchJob = async (jobId: string) => {
    try {
      setLoading(true)

      const { data: jobData, error: jobError } = await supabase
        .from("job")
        .select("*, company (company_id, company_name, email)")
        .eq("job_id", jobId)
        .single()

      if (jobError) throw jobError
      if (!jobData) throw new Error("Job not found")

      setJob(jobData)

      const { data: companyJobs, error: jobsError } = await supabase
        .from("job")
        .select("*")
        .eq("company_id", jobData.company_id)
        .neq("job_id", jobId)

      if (jobsError) throw jobsError
      setRelatedJobs(companyJobs || [])
    } catch (err: any) {
      setError(err.message || "Failed to load job")
      console.error("Error fetching job:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setApplicationForm({ ...applicationForm, resume: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { name, email, resume } = applicationForm;
      if (!resume) throw new Error("Please upload a resume");

      const formData = new FormData();
      formData.append("job_id", job?.job_id || "");
      formData.append("job_description", job?.description || "");
      formData.append("name", name);
      formData.append("email", email);
      formData.append("resume", resume);

      const response = await fetch(
        "http://localhost:5001/upload_resume",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Webhook failed: ${response.status} - ${text}`);
      }

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
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto py-12 px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex gap-3">
              <svg className="h-6 w-6 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 mt-1">{error || "Failed to load job details"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto py-12 px-6 lg:px-8">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors mb-8 group">
          <svg className="h-5 w-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">{job.title}</h1>
          <p className="mt-3 text-lg text-slate-600">
            {job.company_name} • Posted {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-lg p-1 shadow-sm">
            <TabsTrigger value="description" className="rounded-md data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              Job Description
            </TabsTrigger>
            <TabsTrigger value="application" className="rounded-md data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700">
              Application
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Job Details</h3>
              </div>
              <div className="px-8 py-6 space-y-6">
                <div>
                  <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Company</dt>
                  <dd className="text-lg text-slate-900">{job.company_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</dt>
                  <dd className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {job.description || "No description provided."}
                  </dd>
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <Button
                  onClick={() => setActiveTab("application")}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Apply for this job
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="application" className="mt-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900">Apply for this Position</h3>
                <p className="mt-2 text-slate-600">
                  Fill out the form below to submit your application for {job.title}
                </p>
              </div>
              <div className="px-8 py-8">
                {submitSuccess ? (
                  <div className="rounded-xl bg-green-50 border border-green-200 p-6">
                    <div className="flex gap-4">
                      <svg className="h-6 w-6 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 text-lg">Application submitted successfully!</h3>
                        <p className="mt-2 text-green-700">
                          Thank you for applying. We'll review your application and get back to you soon.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setSubmitSuccess(false)}
                          className="mt-6 border-green-600 text-green-700 hover:bg-green-50"
                        >
                          Submit another application
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
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
                        className="mt-2 h-12 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="mt-2 h-12 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
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
                        className="mt-2 h-12 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <p className="mt-2 text-sm text-slate-500">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                      {applicationForm.resume && (
                        <p className="mt-2 text-sm font-medium text-slate-700">Selected: {applicationForm.resume.name}</p>
                      )}
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting} 
                        className="w-full h-12 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {relatedJobs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Other Open Positions at {job.company_name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedJobs.map((relatedJob) => (
                <div key={relatedJob.job_id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 transition-colors">
                        <span className="text-indigo-600 font-bold text-lg group-hover:text-white transition-colors">
                          {relatedJob.company_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {relatedJob.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">{relatedJob.company_name}</p>
                      </div>
                    </div>
                    <p className="text-slate-600 mt-4 line-clamp-2 leading-relaxed">
                      {relatedJob.description}
                    </p>
                    <Link
                      href={`/jobs/${relatedJob.job_id}`}
                      className="inline-flex items-center gap-2 text-indigo-600 font-semibold mt-4 group-hover:gap-3 transition-all"
                    >
                      View details
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  )
}