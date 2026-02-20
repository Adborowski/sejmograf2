'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getClubColorMap } from '@/lib/clubStyles';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm min-w-36">
      <p className="font-semibold text-gray-900 mb-1">Posiedzenie #{label}</p>
      {date && <p className="text-gray-400 text-xs mb-2">{date}</p>}
      {payload
        .slice()
        .sort((a: any, b: any) => b.value - a.value)
        .map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 text-xs truncate max-w-24">{entry.dataKey === 'overall' ? 'Wszyscy' : entry.dataKey}</span>
            </div>
            <span className="font-medium tabular-nums text-xs" style={{ color: entry.color }}>
              {entry.value?.toFixed(1)}%
            </span>
          </div>
        ))}
    </div>
  );
}

export function AttendanceChart({ meps, initialVisible }: { meps: any[]; initialVisible?: string[] }) {
  const { chartData, clubs, clubColors } = useMemo(() => {
    // Map: sitting -> aggregates for overall + each club
    type SittingEntry = {
      totalVoted: number;
      totalVotings: number;
      date: string;
      clubs: Map<string, { totalVoted: number; totalVotings: number }>;
    };
    const sittingMap = new Map<number, SittingEntry>();

    for (const mep of meps) {
      if (!mep.votingStats) continue;
      for (const [key, stat] of Object.entries(mep.votingStats as Record<string, any>)) {
        const sitting = Number(key);
        if (!sittingMap.has(sitting)) {
          sittingMap.set(sitting, { totalVoted: 0, totalVotings: 0, date: stat.date ?? '', clubs: new Map() });
        }
        const entry = sittingMap.get(sitting)!;
        entry.totalVoted += stat.numVoted || 0;
        entry.totalVotings += stat.numVotings || 0;

        if (mep.club) {
          if (!entry.clubs.has(mep.club)) {
            entry.clubs.set(mep.club, { totalVoted: 0, totalVotings: 0 });
          }
          const c = entry.clubs.get(mep.club)!;
          c.totalVoted += stat.numVoted || 0;
          c.totalVotings += stat.numVotings || 0;
        }
      }
    }

    // Discover all clubs, sorted by name
    const clubSet = new Set<string>();
    for (const mep of meps) { if (mep.club) clubSet.add(mep.club); }
    const clubs = Array.from(clubSet).sort();
    const clubColors = getClubColorMap(clubs);

    // Build chart data points
    const chartData = Array.from(sittingMap.entries())
      .sort(([a], [b]) => a - b)
      .flatMap(([sitting, data]) => {
        if (data.totalVotings === 0) return [];
        const point: Record<string, any> = {
          sitting,
          date: data.date,
          overall: parseFloat(((data.totalVoted / data.totalVotings) * 100).toFixed(1)),
        };
        for (const [club, cd] of data.clubs) {
          if (cd.totalVotings > 0) {
            point[club] = parseFloat(((cd.totalVoted / cd.totalVotings) * 100).toFixed(1));
          }
        }
        return [point];
      });

    return { chartData, clubs, clubColors };
  }, [meps]);

  // hiddenClubs initialized to empty; populated once clubs load (async meps data).
  // useEffect avoids the stale-closure bug where useState initializer runs
  // before meps arrive and clubs is still [].
  const [hiddenClubs, setHiddenClubs] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && clubs.length > 0) {
      setHiddenClubs(new Set(clubs.filter((c) => !initialVisible?.includes(c))));
      setInitialized(true);
    }
  }, [clubs, initialized, initialVisible]);
  const toggle = (club: string) =>
    setHiddenClubs((prev) => { const s = new Set(prev); s.has(club) ? s.delete(club) : s.add(club); return s; });
  const showOverall = !hiddenClubs.has('overall');

  if (chartData.length === 0) return null;

  // Y-axis domain: based on min/max of visible series
  const visibleValues = chartData.flatMap((d) => {
    const vals: number[] = [];
    if (showOverall && d.overall != null) vals.push(d.overall);
    for (const club of clubs) {
      if (!hiddenClubs.has(club) && d[club] != null) vals.push(d[club]);
    }
    return vals;
  });
  const minVal = visibleValues.length ? Math.max(0, Math.floor(Math.min(...visibleValues) - 3)) : 0;
  const maxVal = visibleValues.length ? Math.min(100, Math.ceil(Math.max(...visibleValues) + 1)) : 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-6">
      <h3 className="font-semibold text-gray-900">Obecność w czasie</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Średnia ważona na posiedzenie · {chartData.length} posiedzeń · uwzględnia posłów nieaktywnych (statystyki obejmują wyłącznie okres aktywnego mandatu)
      </p>

      {/* Club toggle legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Overall toggle */}
        <button
          onClick={() => toggle('overall')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-opacity ${
            showOverall ? 'opacity-100' : 'opacity-35'
          }`}
          style={{ borderColor: '#6b7280', color: '#6b7280' }}
        >
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: '#6b7280' }} />
          Wszyscy posłowie
        </button>
        {clubs.map((club) => {
          const color = clubColors[club];
          const visible = !hiddenClubs.has(club);
          return (
            <button
              key={club}
              onClick={() => toggle(club)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-opacity ${
                visible ? 'opacity-100' : 'opacity-35'
              }`}
              style={{ borderColor: color, color }}
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {club}
            </button>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="sitting"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Posiedzenie', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#d1d5db' }}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />

          {/* Overall average — grey dashed, thicker */}
          <Line
            type="linear"
            dataKey="overall"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            hide={!showOverall}
          />

          {/* One line per club */}
          {clubs.map((club) => (
            <Line
              key={club}
              type="linear"
              dataKey={club}
              stroke={clubColors[club]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: clubColors[club] }}
              hide={hiddenClubs.has(club)}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
