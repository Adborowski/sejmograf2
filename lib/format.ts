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
