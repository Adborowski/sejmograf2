"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useMeps, useClubs } from "@/hooks/useMeps";
import MepList from "@/components/meps/MepList";
import { Mep } from "@/types/mep";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { meps, loading: mepsLoading, error: mepsError } = useMeps();
  const { clubs, loading: clubsLoading } = useClubs();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div>
                <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
                <p className="text-xs text-gray-500">Polish Parliament Monitor</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/leaderboard"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Leaderboard
                </Link>
                <span className="text-sm text-gray-600">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Members of Parliament
            </h2>
            <p className="text-gray-600">
              Browse and search through Polish Sejm representatives
            </p>
          </div>

          {/* Loading State */}
          {mepsLoading || clubsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading MEPs...</p>
              </div>
            </div>
          ) : mepsError ? (
            // Error State
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Error Loading Data
              </h3>
              <p className="text-red-700">{mepsError}</p>
            </div>
          ) : (
            // MEP List
            <MepList meps={meps as Mep[]} clubs={clubs} />
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
