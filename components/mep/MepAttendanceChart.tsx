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

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { sitting, date, rate } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900">Sitting #{sitting}</p>
      {date && <p className="text-gray-400 text-xs mb-1">{date}</p>}
      <p className="font-medium text-blue-600">{rate.toFixed(1)}%</p>
    </div>
  );
}

interface Props {
  statsEntries: VotingStat[];
  overallRate: number; // 0-100
}

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
    <div className="bg-white rounded-lg shadow-md p-5 mb-6">
      <h3 className="font-semibold text-gray-900">Attendance per sitting</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Vote participation rate for each sitting · dashed line shows overall average
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="sitting"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Sitting', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: '#d1d5db' }}
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
          <ReferenceLine
            y={overallRate}
            stroke="#9ca3af"
            strokeDasharray="5 3"
            strokeWidth={1.5}
          />
          <Line
            type="linear"
            dataKey="rate"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
