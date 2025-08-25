'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail, Calendar } from 'lucide-react';
import ProtectedRoute from '@/components/auth/protected-route';
import { guard } from '@/lib/authing-guard';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // First, logout from Authing
      await guard.logout();
      console.log('Successfully logged out from Authing');
    } catch (error) {
      console.error('Error logging out from Authing:', error);
    } finally {
      // Then clear local state and redirect
      logout();
      router.push('/');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">DaTai Dashboard</h1>
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Welcome Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Welcome back, {user?.nickname || user?.uid}!
                    </h2>
                    <p className="text-gray-600">
                      You're successfully logged into your DaTai account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info Cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          User ID
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {user?.uid}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {user?.email && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Mail className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Email
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {user.email}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Member Since
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  What's Next?
                </h3>
                <div className="text-gray-600 space-y-2">
                  <p>• Create and manage your professional profile</p>
                  <p>• Connect with other professionals</p>
                  <p>• Share insights and articles</p>
                  <p>• Join professional groups and events</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 