'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.error('Error getting session:', error);

      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen to auth changes in real-time
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const features = [
    {
      name: 'AI-Powered Interviews',
      description:
        'Conduct intelligent interviews with automated question generation based on job requirements and candidate profiles.',
    },
    {
      name: 'Multi-Agent Evaluation',
      description:
        'Get comprehensive candidate analysis from multiple AI agents with different perspectives.',
    },
    {
      name: 'ATS Resume Checking',
      description: 'Ensure resumes meet ATS requirements for better visibility and ranking.',
    },
    {
      name: 'Time-Saving Automation',
      description:
        'Reduce time-to-hire by automating initial screening and interview processes.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
            Revolutionize Your{' '}
            <span className="block bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Hiring Process
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed">
            AI-powered interviews that save you time and help you find the best candidates through multi-agent evaluation and comprehensive analysis.
          </p>

          {/* Only show button if user is NOT signed in */}
          {!loading && !user && (
            <div className="pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-105"
              >
                Get Started for Free
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Features
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              A better way to hire
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature) => (
              <div key={feature.name} className="flex gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                  <svg
                    className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900">
                    {feature.name}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
