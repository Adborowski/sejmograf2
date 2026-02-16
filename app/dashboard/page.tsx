"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-neutral-950 text-xl font-bold">Dashboard</h1>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-neutral-950 text-2xl font-bold mb-4">
              Welcome!
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">User ID:</span> {user?.uid}
              </p>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Next Steps
            </h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Build your app features here</li>
              <li>Use Firebase Realtime Database for data storage</li>
              <li>Customize the UI with Tailwind CSS</li>
              <li>Add more protected routes as needed</li>
            </ul>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
