"use client";

import { useMemo } from "react";
import { useMeps } from "@/hooks/useMeps";
import { AttendanceChart } from "@/components/leaderboard/AttendanceChart";
import { ClubCards } from "@/components/leaderboard/ClubCards";
import { MepRankRow } from "@/components/leaderboard/MepRankRow";
import { BiggestMovers } from "@/components/dashboard/BiggestMovers";
import { RecentReviews } from "@/components/dashboard/RecentReviews";
import { FEATURES } from "@/lib/features";
import { useLatestSittingDate } from "@/hooks/useLatestSittingDate";
import { ButtonLink, Card, ErrorState, LoadingState, Page } from "@/components/ui";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";

const LEADERBOARD_SIZE = 10;

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular text-white">{value}</p>
      <p className="text-xs sm:text-sm text-blue-200/80 mt-1">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const { meps, sittings, loading, error } = useMeps();
  const { sitting, date } = useLatestSittingDate();

  const activeSorted = useMemo(
    () =>
      [...meps]
        .filter((m) => m.active && m.attendanceRate !== null && m.attendanceRate !== undefined)
        .sort((a, b) => b.attendanceRate - a.attendanceRate),
    [meps],
  );

  const top = activeSorted.slice(0, LEADERBOARD_SIZE);
  const bottom = activeSorted.slice(-LEADERBOARD_SIZE).reverse();

  // Dense ranking: ties share the same rank; next distinct value increments by 1.
  const rankMap = useMemo(() => {
    const map = new Map<number, number>();
    let currentRank = 1;
    for (let i = 0; i < activeSorted.length; i++) {
      if (i > 0 && activeSorted[i].attendanceRate !== activeSorted[i - 1].attendanceRate) currentRank++;
      map.set(activeSorted[i].id, currentRank);
    }
    return map;
  }, [activeSorted]);

  // Headline numbers for the hero: weighted attendance of active MEPs
  const headline = useMemo(() => {
    const voted = activeSorted.reduce((s, m) => s + (m.totalVoted ?? 0), 0);
    const votings = activeSorted.reduce((s, m) => s + (m.totalVotings ?? 0), 0);
    return { attendance: votings > 0 ? voted / votings : null, active: activeSorted.length };
  }, [activeSorted]);

  const mepNameMap = new Map(meps.map((m: any) => [m.id, m.fullName as string]));
  const getMepName = (id: number) => mepNameMap.get(id) ?? null;

  return (
    <Page>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-10 sm:px-10 sm:py-14 mb-10">
        {/* Decorative glow + grid, purely visual */}
        <div aria-hidden="true" className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--color-accent)]/25 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 ring-1 ring-inset ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {date && sitting ? `Dane do posiedzenia nr ${sitting} · ${formatDate(date)}` : "Sejm RP · X kadencja"}
          </p>
          <h1 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.08]">
            Czy Twój poseł <span className="text-[#ff6b73]">naprawdę</span> pracuje?
          </h1>
          <p className="mt-4 text-base sm:text-lg text-blue-100/80 leading-relaxed max-w-2xl">
            Obecność na głosowaniach, lojalność wobec klubu, wystąpienia i interpelacje — wszystkich 460 posłów,
            w jednym miejscu. Prosto z danych Sejmu.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/search" variant="inverse">Znajdź swojego posła →</ButtonLink>
            <ButtonLink href="/glosowania" variant="ghost" className="text-white hover:bg-white/10 ring-1 ring-inset ring-white/20">
              Jak głosowano?
            </ButtonLink>
          </div>
        </div>

        <div className="relative mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 pt-6">
          <HeroStat label="średnia obecność" value={headline.attendance !== null ? formatPercent(headline.attendance) : "—"} />
          <HeroStat label="aktywnych posłów" value={headline.active ? formatNumber(headline.active) : "—"} />
          <HeroStat label="posiedzeń w kadencji" value={sittings.length ? formatNumber(sittings.length) : "—"} />
          <HeroStat label="głosowań w kadencji" value={activeSorted[0]?.totalVotings ? formatNumber(activeSorted[0].totalVotings) : "—"} />
        </div>
      </section>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="space-y-10">
          <section>
            <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Ranking obecności</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Udział w głosowaniach od początku kadencji, aktywni posłowie.
                </p>
              </div>
              <ButtonLink href="/leaderboard" variant="secondary" size="sm">Pełny ranking →</ButtonLink>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card
                padded={false}
                title={<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />Najwyższa obecność</span>}
                description={`Top ${LEADERBOARD_SIZE}`}
              >
                <div className="divide-y divide-slate-100">
                  {top.map((mep) => (
                    <MepRankRow key={mep.id} rank={rankMap.get(mep.id)!} mep={mep} highlight="top" />
                  ))}
                </div>
              </Card>
              <Card
                padded={false}
                title={<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500" />Najniższa obecność</span>}
                description={`Ostatnie ${LEADERBOARD_SIZE}`}
              >
                <div className="divide-y divide-slate-100">
                  {bottom.map((mep) => (
                    <MepRankRow key={mep.id} rank={rankMap.get(mep.id)!} mep={mep} highlight="bottom" />
                  ))}
                </div>
              </Card>
            </div>
          </section>

          <BiggestMovers />

          <ClubCards meps={meps} />

          <AttendanceChart meps={meps} sittings={sittings} />

          {FEATURES.reviews && <RecentReviews getMepName={getMepName} />}
        </div>
      )}
    </Page>
  );
}
