import { describe, it, expect } from 'vitest';
import { formatNumber, formatPercent, formatDate, plural } from '@/lib/format';

// pl-PL groups with a (narrow) no-break space; normalise for comparison
const plain = (s: string) => s.replace(/\s/g, ' ');

describe('format', () => {
  it('formats numbers the Polish way', () => {
    expect(formatNumber(4879)).toBe('4879'); // no grouping below 10 000
    expect(plain(formatNumber(43292))).toBe('43 292');
  });

  it('formats percentages with a decimal comma', () => {
    expect(formatPercent(0.851)).toBe('85,1%');
    expect(formatPercent(1, 0)).toBe('100%');
  });

  it('formats dates', () => {
    expect(formatDate('2026-10-08')).toMatch(/8 paź 2026/);
    expect(formatDate('2026-10-08T15:17:22')).toMatch(/8 paź 2026/);
  });

  it('picks Polish plural forms', () => {
    const p = (n: number) => plural(n, 'poseł', 'posłów', 'posłów');
    const g = (n: number) => plural(n, 'głosowanie', 'głosowania', 'głosowań');
    expect([g(1), g(2), g(4), g(5), g(12), g(22), g(25)]).toEqual([
      'głosowanie', 'głosowania', 'głosowania', 'głosowań', 'głosowań', 'głosowania', 'głosowań',
    ]);
    expect(p(1)).toBe('poseł');
  });
});
