'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ButtonLink, CARD_CLASS, Page } from '@/components/ui';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === '1';

  return (
    <Page width="narrow">
        <div className={`${CARD_CLASS} p-8 sm:p-10 max-w-lg mx-auto text-center mt-8`}>
          {success ? (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Wypisano pomyślnie</h1>
              <p className="text-slate-500 text-sm mb-6">
                Twój adres e-mail został usunięty z listy. Nie będziesz już otrzymywać wiadomości od Sejmografu.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Nieprawidłowy link</h1>
              <p className="text-slate-500 text-sm mb-6">
                Link do wypisania jest nieprawidłowy lub wygasł. Aby wypisać się z listy, odpowiedz na otrzymaną wiadomość.
              </p>
            </>
          )}
          <ButtonLink href="/">Wróć do Sejmografu</ButtonLink>
        </div>
    </Page>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
