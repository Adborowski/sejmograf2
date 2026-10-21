'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { VotingStat } from '@/types/mep';
import { formatDate, formatPercent } from '@/lib/format';

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { sitting, date, rate } = payload[0].payload;
  return (
    <div className="bg-white rounded-lg shadow-lg ring-1 ring-slate-900/10 px-3 py-2 text-sm">
      <p className="font-semibold text-slate-900">Posiedzenie nr {sitting}</p>
      {date && <p className="text-slate-400 text-xs mb-1">{formatDate(date)}</p>}
      <p className="font-medium text-blue-700 tabular">{formatPercent(rate / 100)}</p>
    </div>
  );
}

interface Props {
  statsEntries: VotingStat[]; // oldest first
  overallRate: number; // 0-100
}

/** Per-sitting attendance line with the overall average as a dashed reference */
export function MepAttendanceChart({ statsEntries, overallRate }: Props) {
  const chartData = statsEntries
    .filter((s) => s.numVotings > 0)
    .map((s) => ({
      sitting: s.sitting,
      date: s.date,
      rate: parseFloat(((s.numVoted / s.numVotings) * 100).toFixed(1)),
    }));

  if (chartData.length === 0) return null;

  const rates = chartData.map((d) => d.rate);
  const minVal = Math.max(0, Math.floor(Math.min(...rates) - 3));
  const maxVal = Math.min(100, Math.ceil(Math.max(...rates) + 1));

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="sitting"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
          <ReferenceLine y={overallRate} stroke="#94a3b8" strokeDasharray="5 3" strokeWidth={1.5} />
          <Line
            type="linear"
            dataKey="rate"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#ffffff', fill: '#2563eb' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-2">Obecność na kolejnych posiedzeniach · linia przerywana: średnia z kadencji</p>
    </div>
  );
}
