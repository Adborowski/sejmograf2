"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar } from "@/components/layout/NavBar";

const ADMIN_EMAIL = "adborowski@gmail.com";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SmallBlastEntry {
  name: string;
  email: string;
  sentAt: string;
  variantKey: string;
  id?: string;
  error?: boolean;
  errorMessage?: string;
  dryRun?: boolean;
}

interface BigBlastEntry {
  mepId: number;
  email: string;
  fullName: string;
  club: string;
  sentAt: string;
}

interface SmallBlastData {
  sent: SmallBlastEntry[];
}

interface BigBlastData {
  totalWithEmail: number;
  totalActive: number;
  entries: BigBlastEntry[];
}

interface EditorBlastEntry {
  name: string;
  email: string;
  outlet: string | null;
  sentAt: string;
  id?: string;
  error?: boolean;
  skipped?: boolean;
  skipReason?: string;
}

interface EditorBlastData {
  totalEditors: number;
  entries: EditorBlastEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Warsaw",
  });
}

function statusBadge(sent: number, total: number) {
  if (sent === 0)
    return { label: "Nie rozpoczęto", color: "bg-gray-100 text-gray-600" };
  if (sent >= total)
    return { label: "Ukończono", color: "bg-green-100 text-green-700" };
  return { label: "W trakcie", color: "bg-blue-100 text-blue-700" };
}

function getDailyCounts(entries: BigBlastEntry[]) {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    const day = e.sentAt.slice(0, 10);
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);
}

function estimatedCompletion(remaining: number, dailyRate: number) {
  if (remaining <= 0) return "Gotowe";
  if (dailyRate === 0) return "—";
  const days = Math.ceil(remaining / dailyRate);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}

// Editor blast cron: 0 * * * * — fires at the top of every hour
function nextEditorBlastRun() {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCMinutes(0, 0, 0);
  nextRun.setUTCHours(nextRun.getUTCHours() + 1);
  const diffMs = nextRun.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const timeStr = nextRun.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });
  return { countdown: `${diffMins} min.`, timeStr };
}

// Small blast cron: 0 */4 * * * — fires at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
function nextSmallBlastRun() {
  const now = new Date();
  const nextRun = new Date(now);
  const currentHourUtc = now.getUTCHours();
  const nextHourUtc = Math.ceil((currentHourUtc + 1) / 4) * 4; // next multiple of 4
  if (nextHourUtc >= 24) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    nextRun.setUTCHours(0, 0, 0, 0);
  } else {
    nextRun.setUTCHours(nextHourUtc, 0, 0, 0);
  }
  const diffMs = nextRun.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  const timeStr = nextRun.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });
  const countdown = h > 0 ? `${h} godz. ${m} min.` : `${m} min.`;
  return { countdown, timeStr };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlastMonitorPage() {
  const { user, loading: authLoading } = useAuth();
  const [small, setSmall] = useState<SmallBlastData | null>(null);
  const [big, setBig] = useState<BigBlastData | null>(null);
  const [editors, setEditors] = useState<EditorBlastData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [smallOpen, setSmallOpen] = useState(true);
  const [editorsOpen, setEditorsOpen] = useState(true);
  const [bigOpen, setBigOpen] = useState(true);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    Promise.all([
      getDoc(doc(firestore, "blast_progress", "small_blast")),
      getDoc(doc(firestore, "blast_progress", "big_blast")),
      getDoc(doc(firestore, "blast_progress", "editor_blast")),
    ]).then(([s, b, e]) => {
      setSmall(s.exists() ? (s.data() as SmallBlastData) : { sent: [] });
      setBig(b.exists() ? (b.data() as BigBlastData) : null);
      setEditors(e.exists() ? (e.data() as EditorBlastData) : null);
      setDataLoading(false);
    });
  }, [user]);

  // ── Auth gate ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar backHref="/" />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">Brak dostępu.</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Loading data ────────────────────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar backHref="/" subtitle="Blast Monitor" maxWidth="max-w-4xl" />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  // ── Small blast data ────────────────────────────────────────────────────────
  const smallSent = small?.sent ?? [];
  const smallTotal = 18;
  const smallBadge = statusBadge(smallSent.length, smallTotal);
  const smallPct = Math.round((smallSent.length / smallTotal) * 100);
  const nextRun = nextSmallBlastRun();

  // ── Big blast data ──────────────────────────────────────────────────────────
  const bigEntries = big?.entries ?? [];
  const bigTotal = big?.totalWithEmail ?? 0;
  const bigBadge = statusBadge(bigEntries.length, bigTotal);
  const nextEditorRun = nextEditorBlastRun();
  const bigPct =
    bigTotal > 0 ? Math.round((bigEntries.length / bigTotal) * 100) : 0;
  const dailyCounts = getDailyCounts(bigEntries);
  const recentBig = [...bigEntries]
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .slice(0, 10);
  const avgPerDay =
    dailyCounts.length > 0
      ? Math.round(
          dailyCounts.reduce((s, [, c]) => s + c, 0) / dailyCounts.length,
        )
      : 15;
  const bigEst = estimatedCompletion(bigTotal - bigEntries.length, avgPerDay);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/" subtitle="Blast Monitor" maxWidth="max-w-4xl" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* ── Small blast card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => setSmallOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Blast A - Domain Warmup
              </h2>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${smallOpen ? "" : "-rotate-90"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${smallBadge.color}`}>
              {smallBadge.label}
            </span>
          </button>

          {smallOpen && (
            <>
              {/* Progress bar */}
              <div className="mb-1 flex justify-between text-sm text-gray-500">
                <span>
                  {smallSent.length} / {smallTotal} wysłanych
                </span>
                <span>{smallPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${smallPct}%` }}
                />
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Uruchamia się automatycznie co 4 godziny przez GitHub Actions
                (workflow: <code>small-blast.yml</code>).
                {smallSent.length < smallTotal && (
                  <>
                    {" "}
                    Następna wysyłka za{" "}
                    <span className="font-medium text-gray-600">
                      {nextRun.countdown}
                    </span>{" "}
                    (ok. {nextRun.timeStr}).
                  </>
                )}
              </p>

              {smallSent.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  Brak wysłanych wiadomości.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-2 font-medium">Odbiorca</th>
                        <th className="pb-2 font-medium">Data wysyłki</th>
                        <th className="pb-2 font-medium">Wariant</th>
                        <th className="pb-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {smallSent.map((e, i) => (
                        <tr key={i}>
                          <td className="py-2 text-gray-700">{e.name}</td>
                          <td className="py-2 text-gray-500">
                            {formatDate(e.sentAt)}
                          </td>
                          <td className="py-2 font-mono text-xs text-gray-400">
                            {e.variantKey}
                          </td>
                          <td className="py-2">
                            {e.error ? (
                              <span className="text-red-500 text-xs">✗ Błąd</span>
                            ) : (
                              <span className="text-green-600 text-xs">✓ OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Editors blast card (Blast B) ─────────────────────────── */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => setEditorsOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Blast B - Redakcje
              </h2>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${editorsOpen ? "" : "-rotate-90"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(editors?.entries.length ?? 0, editors?.totalEditors ?? 0).color}`}>
              {statusBadge(editors?.entries.length ?? 0, editors?.totalEditors ?? 0).label}
            </span>
          </button>

          {editorsOpen && (!editors ? (
            <p className="text-sm text-gray-400 italic">
              Blast nie został jeszcze uruchomiony.
            </p>
          ) : (
            <>
              <div className="mb-1 flex justify-between text-sm text-gray-500">
                <span>
                  {editors.entries.length} / {editors.totalEditors} wysłanych
                </span>
                <span>
                  {editors.totalEditors > 0
                    ? Math.round((editors.entries.length / editors.totalEditors) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${editors.totalEditors > 0 ? Math.round((editors.entries.length / editors.totalEditors) * 100) : 0}%`,
                  }}
                />
              </div>

              {editors.entries.length < editors.totalEditors && (
                <p className="text-xs text-gray-400 mb-5">
                  Uruchamia się automatycznie co godzinę przez GitHub Actions
                  (workflow: <code>editor-blast.yml</code>). Następna wysyłka za{" "}
                  <span className="font-medium text-gray-600">
                    {nextEditorRun.countdown}
                  </span>{" "}
                  (ok. {nextEditorRun.timeStr}).
                </p>
              )}

              {editors.entries.length > 0 && (
                <>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Ostatnie wysyłki
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                          <th className="pb-2 font-medium">Redakcja</th>
                          <th className="pb-2 font-medium">Email</th>
                          <th className="pb-2 font-medium">Data wysyłki</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[...editors.entries]
                          .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
                          .slice(0, 10)
                          .map((e, i) => (
                            <tr key={i}>
                              <td className="py-2 text-gray-700">
                                {e.outlet ?? "—"}
                              </td>
                              <td className="py-2 text-gray-500 text-xs">
                                {e.email}
                              </td>
                              <td className="py-2 text-gray-500">
                                {formatDate(e.sentAt)}
                              </td>
                              <td className="py-2">
                                {e.skipped ? (
                                  <span className="text-yellow-600 text-xs">⚠ Brak MX</span>
                                ) : e.error ? (
                                  <span className="text-red-500 text-xs">✗ Błąd</span>
                                ) : (
                                  <span className="text-green-600 text-xs">✓ OK</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ))}
        </div>

        {/* ── MEP blast card (Blast C, on hold) ────────────────────────── */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => setBigOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Blast C - Posłowie (wstrzymany)
              </h2>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${bigOpen ? "" : "-rotate-90"}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${bigBadge.color}`}>
              {bigBadge.label}
            </span>
          </button>

          {bigOpen && (bigTotal === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Blast nie został jeszcze uruchomiony.
            </p>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-1 flex justify-between text-sm text-gray-500">
                <span>
                  {bigEntries.length} / {bigTotal} wysłanych
                </span>
                <span>{bigPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${bigPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mb-5">
                Szacowane zakończenie:{" "}
                <span className="font-medium text-gray-600">{bigEst}</span> ·
                Średnia dzienna: {avgPerDay} wiadomości
              </p>

              {/* Daily counts */}
              {dailyCounts.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Wysyłki (ostatnie 7 dni)
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {dailyCounts.map(([day, count]) => (
                      <div
                        key={day}
                        className="bg-gray-50 rounded px-3 py-1.5 text-center"
                      >
                        <div className="text-xs text-gray-400">
                          {formatShortDate(day)}
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent sends */}
              {recentBig.length > 0 && (
                <>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Ostatnie wysyłki
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                          <th className="pb-2 font-medium">Poseł</th>
                          <th className="pb-2 font-medium">Klub</th>
                          <th className="pb-2 font-medium">Data wysyłki</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentBig.map((e, i) => (
                          <tr key={i}>
                            <td className="py-2 text-gray-700">{e.fullName}</td>
                            <td className="py-2 text-gray-500 text-xs">
                              {e.club}
                            </td>
                            <td className="py-2 text-gray-500">
                              {formatDate(e.sentAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ))}
        </div>
      </main>
    </div>
  );
}
