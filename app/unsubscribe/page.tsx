'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { NavBar } from '@/components/layout/NavBar';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === '1';

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/" maxWidth="max-w-4xl" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-lg mx-auto text-center">
          {success ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Wypisano pomyślnie</h1>
              <p className="text-gray-500 text-sm mb-6">
                Twój adres e-mail został usunięty z listy. Nie będziesz już otrzymywać wiadomości od Sejmografu.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Nieprawidłowy link</h1>
              <p className="text-gray-500 text-sm mb-6">
                Link do wypisania jest nieprawidłowy lub wygasł. Aby wypisać się z listy, odpowiedz na otrzymaną wiadomość.
              </p>
            </>
          )}
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Wróć do Sejmografu
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
