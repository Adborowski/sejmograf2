// Polish number formatting: "4879", "43 292", "85,1%"
const numberFormat = new Intl.NumberFormat('pl-PL');

export const formatNumber = (value: number) => numberFormat.format(value);

/** `share` is 0–1 */
export const formatPercent = (share: number, digits = 1) =>
  `${new Intl.NumberFormat('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(share * 100)}%`;

/** "2026-10-08" → "8 paź 2026" */
export const formatDate = (isoDate: string) => {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? isoDate
    : date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Polish plural: 1 poseł, 2–4 posłów… — pass the three forms */
export const plural = (n: number, one: string, few: string, many: string) => {
  if (n === 1) return one;
  const lastTwo = n % 100;
  const last = n % 10;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? few : many;
};

/** Change in a 0–1 share as percentage points: 0.021 → "+2,1 pp", −0.004 → "−0,4 pp" */
export const formatPointsDelta = (delta: number, digits = 1) => {
  const points = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    .format(Math.abs(delta * 100));
  const isZero = Number(Math.abs(delta * 100).toFixed(digits)) === 0;
  return `${isZero ? '±' : delta > 0 ? '+' : '−'}${points} pp`;
};

/** "2026-11-05", "2026-11-06" → "5–6 lis 2026"; across months/years falls back to two full dates */
export const formatDateRange = (first: string, last: string) => {
  if (first.slice(0, 10) === last.slice(0, 10)) return formatDate(first);
  if (first.slice(0, 7) === last.slice(0, 7)) {
    const day = new Date(`${first.slice(0, 10)}T12:00:00`).getDate();
    return `${day}–${formatDate(last)}`;
  }
  return `${formatDate(first)} – ${formatDate(last)}`;
};
