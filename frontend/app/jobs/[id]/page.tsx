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
  console.log(applicationForm)
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
      formData.append("name", name);
      formData.append("email", email);
      formData.append("resume", resume);

      // Send directly to Activepieces webhook
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || "Failed to load job details"}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/jobs" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Jobs
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{job.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {job.company_name} • Posted on {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="description">Job Description</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
        </TabsList>

  <TabsContent value="description" className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Job Details</h3>
            </div>
            <div className="px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Company</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{job.company_name}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                    {job.description || "No description provided."}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-end">
                <Button
                  variant="default"
                  onClick={() => setActiveTab("application")}
                  className="mt-4"
                >
                  Apply for this job
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="application" className="mt-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Apply for this Position</h3>
              <p className="mt-1 text-sm text-gray-500">
                Fill out the form below to submit your application for {job.title}
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {submitSuccess ? (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Application submitted successfully!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Thank you for applying. We'll review your application and get back to you soon.</p>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" onClick={() => setSubmitSuccess(false)}>
                          Submit another application
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={applicationForm.name}
                      onChange={(e) => setApplicationForm({ ...applicationForm, name: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={applicationForm.email}
                      onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })}
                      placeholder="john.doe@example.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume">Resume</Label>
                    <Input
                      id="resume"
                      type="file"
                      required
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="mt-1"
                    />
                    <p className="mt-2 text-sm text-gray-500">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
                    {applicationForm.resume && (
                      <p className="mt-2 text-sm text-gray-700">Selected: {applicationForm.resume.name}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                      {submitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {relatedJobs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Other Open Positions at {job.company_name}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {relatedJobs.map((job) => (
              <div key={job.job_id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">{job.company_name?.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.company_name}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 line-clamp-2">{job.description}</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/jobs/${job.job_id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      View details <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
