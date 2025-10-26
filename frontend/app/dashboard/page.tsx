'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          
          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Total Candidates', value: '24', change: '+12%', changeType: 'increase' },
              { name: 'Interviews Completed', value: '18', change: '+5%', changeType: 'increase' },
              { name: 'Hiring Rate', value: '42%', change: '+7%', changeType: 'increase' },
              { name: 'Avg. Time to Hire', value: '14 days', change: '-3%', changeType: 'decrease' },
            ].map((stat) => (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
                  <div className={`mt-2 flex items-baseline ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'} text-sm font-semibold`}>
                    {stat.change}
                    <span className="sr-only"> {stat.changeType === 'increase' ? 'Increased' : 'Decreased'} by</span>
                    <svg
                      className={`self-center flex-shrink-0 h-5 w-5 ${stat.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d={stat.changeType === 'increase' 
                          ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        }
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="sr-only"> from last month</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {[
                  { id: 1, name: 'John Doe', action: 'completed', type: 'interview', time: '2 hours ago' },
                  { id: 2, name: 'Jane Smith', action: 'submitted', type: 'resume', time: '5 hours ago' },
                  { id: 3, name: 'Mike Johnson', action: 'scheduled', type: 'interview', time: '1 day ago' },
                  { id: 4, name: 'Sarah Williams', action: 'completed', type: 'interview', time: '2 days ago' },
                ].map((activity) => (
                  <li key={activity.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {activity.name} <span className="text-gray-500">{activity.action} {activity.type}</span>
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
