"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Job } from "@/types/job"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Briefcase, Calendar, Trash2, Pencil } from "lucide-react"

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push("/login")
        return
      }

      const companyId = user.user_metadata?.company_id
      if (!companyId) {
        throw new Error("Company not found for this user")
      }

      const { data: jobsData, error: jobsError } = await supabase
        .from("job")
        .select(`
          *,
          company (
            company_id,
            company_name,
            email
          )
        `)
        .eq("company_id", companyId)

      if (jobsError) throw jobsError

      setJobs(jobsData || [])
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    try {
      const { error } = await supabase.from("job").delete().eq("job_id", jobId)

      if (error) throw error

      fetchJobs()
    } catch (error) {
      console.error("Error deleting job:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-slate-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push("/dashboard")}
          variant="ghost"
          className="mb-6 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              Job Listings
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Manage your job postings and track applications
            </p>
          </div>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105 sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Post New Job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-12 text-center bg-white border-0 shadow-lg">
            <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-900">No job postings yet</h3>
                <p className="text-slate-600 leading-relaxed">
                  Get started by creating your first job posting to attract top talent.
                </p>
              </div>
              <Link
                href="/dashboard/jobs/new"
                className="inline-flex items-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Post Your First Job
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.job_id} className="group hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col bg-white border-0 shadow-lg">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link href={`/dashboard/jobs/${job.job_id}`} className="block">
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 leading-tight">
                          {job.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Posted{" "}
                          {new Date(job.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {job.required_skills.slice(0, 4).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 4 && (
                        <Badge variant="outline" className="text-xs border-indigo-200 text-indigo-600">
                          +{job.required_skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-2">
                    <Link 
                      href={`/dashboard/jobs/${job.job_id}/edit`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    <Button
                      onClick={() => handleDelete(job.job_id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}