'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900">Sejmograf2</h1>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to Sejmograf2
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A modern Next.js application with Firebase authentication and Realtime
            Database integration.
          </p>

          {!user && (
            <div className="flex justify-center gap-4 mb-16">
              <Link
                href="/signup"
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {user && (
            <div className="mb-16">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Next.js 14+</h3>
            <p className="text-gray-600">
              Built with the latest Next.js App Router and React Server Components.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Firebase Auth</h3>
            <p className="text-gray-600">
              Secure authentication with email/password and Google OAuth support.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-blue-600 text-3xl mb-4">💾</div>
            <h3 className="text-xl font-semibold mb-2">Realtime Database</h3>
            <p className="text-gray-600">
              Real-time data synchronization with Firebase Realtime Database.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Create a Firebase project at <a href="https://console.firebase.google.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">console.firebase.google.com</a></li>
            <li>Enable Authentication (Email/Password and Google)</li>
            <li>Enable Realtime Database</li>
            <li>Copy <code className="bg-gray-100 px-2 py-1 rounded">.env.local.example</code> to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
            <li>Add your Firebase configuration to <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></li>
            <li>Sign up for an account and start building!</li>
          </ol>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            Built with Next.js, TypeScript, Tailwind CSS, and Firebase
          </p>
        </div>
      </footer>
    </div>
  );
}
