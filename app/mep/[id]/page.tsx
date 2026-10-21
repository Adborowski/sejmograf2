'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMep } from '@/hooks/useMeps';
import { getMepPhotoBigDirectURL, getMepPhotoDirectURL } from '@/lib/firebase/storage';
import { Mep, VotingStat } from '@/types/mep';
import { MepAttendanceChart } from '@/components/mep/MepAttendanceChart';
import { ReviewsSection } from '@/components/mep/ReviewsSection';
import { RolesSection } from '@/components/mep/RolesSection';
import { ActivitySection } from '@/components/mep/ActivitySection';
import { SpeechesSection } from '@/components/mep/SpeechesSection';
import { LoyaltySection } from '@/components/mep/LoyaltySection';
import { MepVotesSection } from '@/components/mep/MepVotesSection';
import { FEATURES } from '@/lib/features';
import { CLUB_LOGOS } from '@/lib/clubStyles';
import { Badge, CARD_CLASS, Card, ClubBadge, EmptyState, ErrorState, LoadingState, Page, Stat, StatGrid } from '@/components/ui';
import { formatDate, formatNumber, formatPercent } from '@/lib/format';

const capitalizeCompound = (str: string) =>
  str.replace(/(^|[\s-])([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/g, (_, sep, letter) => sep + letter.toUpperCase());

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/** Headline number in the profile header; links to its section below */
function KeyStat({ href, label, value, hint }: { href: string; label: string; value: string; hint?: string }) {
  return (
    <a href={href} className="group rounded-xl px-4 py-3 ring-1 ring-inset ring-slate-200 hover:ring-blue-300 hover:bg-blue-50/40 transition-all">
      <p className="text-xs font-medium text-slate-500 group-hover:text-blue-700">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular text-slate-900">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{hint}</p>}
    </a>
  );
}

function ProfileHeader({ mep, mepId, overallRate }: { mep: Mep; mepId: number; overallRate: number | null }) {
  type PhotoState = 'big' | 'small' | 'error';
  const [photoState, setPhotoState] = useState<PhotoState>('big');
  const photoUrl = photoState === 'big' ? getMepPhotoBigDirectURL(mepId) : getMepPhotoDirectURL(mepId);
  const questions = mep.activity ? mep.activity.interpellations + mep.activity.writtenQuestions : null;

  return (
    <section className={`${CARD_CLASS} p-6 sm:p-8 mb-6`}>
      <div className="flex items-start gap-5 sm:gap-6">
        <div className="relative w-24 h-28 sm:w-28 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-200 ring-1 ring-slate-900/5">
          {photoState !== 'error' ? (
            <Image
              src={photoUrl}
              alt={mep.fullName}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized
              onError={() => setPhotoState(photoState === 'big' ? 'small' : 'error')}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {mep.club && <ClubBadge club={mep.club} />}
            <Badge tone={mep.active ? 'green' : 'neutral'}>{mep.active ? 'Aktywny mandat' : 'Mandat wygasł'}</Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900">{mep.fullName}</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {[
              mep.districtName && `Okręg nr ${mep.districtNum} · ${capitalizeCompound(mep.districtName)}`,
              mep.clubFunction && `${capitalizeFirst(mep.clubFunction)} klubu`,
              `Mandat nr ${mep.id}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {mep.club && CLUB_LOGOS[mep.club] && (
          <img src={CLUB_LOGOS[mep.club]} alt={mep.club} className="hidden sm:block w-14 h-14 object-contain flex-shrink-0" />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
        <KeyStat href="#obecnosc" label="Obecność" value={overallRate !== null ? formatPercent(overallRate) : '—'} hint="na głosowaniach" />
        <KeyStat
          href="#lojalnosc"
          label="Zgodność z klubem"
          value={mep.loyalty?.loyalty != null ? formatPercent(mep.loyalty.loyalty) : '—'}
          hint={mep.loyalty?.clubAverage != null ? `średnia klubu ${formatPercent(mep.loyalty.clubAverage)}` : undefined}
        />
        <KeyStat
          href="#wystapienia"
          label="Wystąpienia"
          value={mep.speeches ? formatNumber(mep.speeches.speeches) : '—'}
          hint="na sali plenarnej"
        />
        <KeyStat
          href="#interpelacje"
          label="Interpelacje i zapytania"
          value={questions !== null ? formatNumber(questions) : '—'}
          hint="w tej kadencji"
        />
      </div>
    </section>
  );
}

function AttendanceSection({ statsEntries, totalVoted, totalVotings }: { statsEntries: VotingStat[]; totalVoted: number; totalVotings: number }) {
  if (statsEntries.length === 0) {
    return <EmptyState inCard title="Brak danych o głosowaniach." />;
  }
  const rate = totalVoted / totalVotings;
  const excused = statsEntries.filter((s) => s.absenceExcuse).length;

  return (
    <Card id="obecnosc" title="Obecność na głosowaniach">
      <StatGrid>
        <Stat emphasis label="Obecność" value={formatPercent(rate)} />
        <Stat label="Głosy oddane" value={formatNumber(totalVoted)} hint={`z ${formatNumber(totalVotings)} głosowań`} />
        <Stat label="Opuszczone głosowania" value={formatNumber(totalVotings - totalVoted)} hint={excused ? `usprawiedliwienia: ${excused} posiedz.` : undefined} />
      </StatGrid>

      <div className="mt-6">
        <MepAttendanceChart statsEntries={[...statsEntries].reverse()} overallRate={rate * 100} />
      </div>

      <details className="group mt-5 rounded-xl ring-1 ring-inset ring-slate-200">
        <summary className="cursor-pointer select-none list-none px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-between">
          Obecność na każdym posiedzeniu ({statsEntries.length})
          <span className="text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="px-4 py-2 text-left font-medium">Posiedzenie</th>
                <th className="px-4 py-2 text-left font-medium">Data</th>
                <th className="px-4 py-2 text-right font-medium">Oddane</th>
                <th className="px-4 py-2 text-right font-medium">Opuszczone</th>
                <th className="px-4 py-2 text-right font-medium">Obecność</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular">
              {statsEntries.map((stat) => {
                const r = stat.numVotings > 0 ? stat.numVoted / stat.numVotings : null;
                return (
                  <tr key={stat.sitting} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-900">nr {stat.sitting}</td>
                    <td className="px-4 py-2 text-slate-500">{formatDate(stat.date)}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{stat.numVoted}</td>
                    <td className={`px-4 py-2 text-right ${stat.numMissed ? 'text-rose-600' : 'text-slate-300'}`}>{stat.numMissed}</td>
                    <td className="px-4 py-2 text-right">
                      {r !== null ? (
                        <span className={`font-medium ${r >= 0.8 ? 'text-slate-900' : r >= 0.5 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {formatPercent(r)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </Card>
  );
}

function BioCard({ mep }: { mep: Mep }) {
  const rows: Array<[string, React.ReactNode]> = [
    ['Data urodzenia', mep.birthDate ? formatDate(mep.birthDate) : null],
    ['Miejsce urodzenia', mep.birthLocation ? capitalizeCompound(mep.birthLocation) : null],
    ['Wykształcenie', mep.educationLevel ? capitalizeFirst(mep.educationLevel) : null],
    ['Zawód', mep.profession ? capitalizeFirst(mep.profession) : <span className="text-slate-400">Nieznany</span>],
    ['Województwo', mep.voivodeship ? capitalizeCompound(mep.voivodeship) : null],
    ['Głosy w wyborach', mep.numberOfVotes != null ? formatNumber(mep.numberOfVotes) : null],
  ];
  return (
    <Card title="Informacje">
      <dl className="space-y-3 text-sm">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-slate-900 text-right">{value}</dd>
            </div>
          ))}
      </dl>
      {mep.email && (
        <a
          href={`mailto:${mep.email}`}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          Napisz e-mail
        </a>
      )}
    </Card>
  );
}

export default function MepStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mepId = parseInt(id, 10);
  const { mep, loading, error } = useMep(mepId);

  // Newest sitting first
  const statsEntries: VotingStat[] = mep?.votingStats
    ? (Object.values(mep.votingStats) as VotingStat[]).sort((a, b) => b.sitting - a.sitting)
    : [];
  const totalVoted = statsEntries.reduce((sum, s) => sum + s.numVoted, 0);
  const totalVotings = statsEntries.reduce((sum, s) => sum + s.numVotings, 0);
  const overallRate = totalVotings > 0 ? totalVoted / totalVotings : null;

  return (
    <Page width="wide">
      <Link href="/search" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6">
        ← Wszyscy posłowie
      </Link>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : !mep ? (
        <EmptyState inCard title="Nie znaleziono posła." description="Sprawdź numer mandatu albo wyszukaj posła na liście." />
      ) : (
        <>
          <ProfileHeader mep={mep} mepId={mepId} overallRate={overallRate} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6 min-w-0">
              <AttendanceSection statsEntries={statsEntries} totalVoted={totalVoted} totalVotings={totalVotings} />
              <LoyaltySection loyalty={mep.loyalty} />
              <MepVotesSection mep={mep} />
              <SpeechesSection speeches={mep.speeches} />
              <ActivitySection mepId={mepId} activity={mep.activity} />
              {FEATURES.reviews && <ReviewsSection mepId={mepId} />}
            </div>
            <aside className="space-y-6 lg:sticky lg:top-20">
              <BioCard mep={mep} />
              <RolesSection committees={mep.committees} clubFunction={mep.clubFunction} club={mep.club} />
            </aside>
          </div>
        </>
      )}
    </Page>
  );
}
