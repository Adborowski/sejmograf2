'use client';

import { useState } from 'react';
import { Button, CARD_CLASS, ErrorState, Label, Page, PageHeader, Spinner, TextArea, TextInput } from '@/components/ui';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Nie udało się wysłać wiadomości');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
      setLoading(false);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Błąd połączenia. Spróbuj ponownie.');
      setLoading(false);
    }
  };

  return (
    <Page width="narrow">
      <PageHeader
        eyebrow="Kontakt"
        title="Napisz do nas"
        description="Sejmograf ciągle się rozwija. Chętnie poznamy Twoją opinię, pomysły na nowe funkcje i zgłoszenia błędów."
      />

      <div className={`${CARD_CLASS} p-6 sm:p-8`}>
        {success ? (
          <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-6 text-center">
            <p className="text-emerald-900 font-medium">Dziękujemy! Wiadomość została wysłana.</p>
            <p className="text-emerald-700 text-sm mt-2">Odpowiemy najszybciej, jak to możliwe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <ErrorState title="Nie udało się wysłać" message={error} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="name">Imię i nazwisko</Label>
                <TextInput id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan Kowalski" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="email">Adres e-mail</Label>
                <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@example.com" disabled={loading} />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Wiadomość</Label>
              <TextArea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Twoja opinia, pomysł albo opis błędu…"
                rows={6}
                className="resize-none"
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Wysyłanie…
                </>
              ) : (
                'Wyślij wiadomość'
              )}
            </Button>
          </form>
        )}
      </div>
    </Page>
  );
}
