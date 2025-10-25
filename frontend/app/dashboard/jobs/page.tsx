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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push("/dashboard")}
          variant="ghost"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">Job Listings</h1>
            <p className="text-muted-foreground text-lg">Manage your job postings and track applications</p>
          </div>
          <Button asChild size="lg" className="sm:w-auto">
            <Link href="/dashboard/jobs/new">
              <Plus className="h-5 w-5 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {jobs.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No job postings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first job posting to attract top talent.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/dashboard/jobs/new">
                  <Plus className="h-5 w-5 mr-2" />
                  Post Your First Job
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.job_id} className="group hover:shadow-lg transition-all duration-200 flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link href={`/dashboard/jobs/${job.job_id}`} className="block">
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2 text-balance">
                          {job.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {job.required_skills.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.required_skills.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/jobs/${job.job_id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      onClick={() => handleDelete(job.job_id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
