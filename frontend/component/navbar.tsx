'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)

  const pathname = usePathname()

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.error('Error getting session:', error)
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)

      if (sessionUser) {
        const { data: companyData } = await supabase
          .from('company')
          .select('company_name')
          .eq('id', sessionUser.id)
          .single()
        setCompanyName(companyData?.company_name ?? null)
      }

      setLoading(false)
    }
    getSession()

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
  }

  const toggleDropdown = () => setDropdownOpen((prev) => !prev)

  // ✅ Determine label & href dynamically
  const isJobsPage = pathname === '/' || pathname.startsWith('/jobs')
  const jobsLabel = isJobsPage ? 'Jobs' : 'Job Postings'
  const jobsHref = isJobsPage ? '/jobs' : '/dashboard/jobs'

  return (
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
            >
              InterviewAI
            </Link>

            <Link
              href={jobsHref}
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              {jobsLabel}
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 relative">
            {loading ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                >
                  {/* Initial */}
                  <div className="bg-indigo-600 text-white font-bold w-8 h-8 flex items-center justify-center rounded-full">
                    {user ? user.user_metadata.company_name[0].toUpperCase() : 'C'}
                  </div>
                  {/* Company Name */}
                  <span className="text-slate-700 font-medium">
                    {user ? user.user_metadata.company_name : 'Company'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
