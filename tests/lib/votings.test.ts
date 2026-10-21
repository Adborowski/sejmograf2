import { describe, it, expect } from 'vitest';
import { gzipSync } from 'zlib';
import {
  VotingIndex,
  normalize,
  stem,
  searchVotings,
  seatedPositions,
  voteAt,
  entryAt,
  decodeVotingIndex,
} from '@/lib/votings';

const index: VotingIndex = {
  indexId: '4:2/2',
  titles: ['Pkt. 5 Projekt ustawy o ochronie zwierząt', 'Pkt. 7 Prawo do przerywania ciąży', 'Wybór Marszałka'],
  rows: [
    [1, 1, '2023-11-13', 2, '', 0, 0, 0, 1],
    [1, 2, '2023-11-14', 0, 'wniosek o odrzucenie', 100, 300, 10, 0],
    [2, 1, '2024-04-12', 1, 'głosowanie nad całością', 220, 230, 5, 0],
    [2, 2, '2024-04-12', 0, 'poprawka 3 dotycząca łańcuchów', 250, 200, 5, 0],
  ],
};

describe('normalize', () => {
  it('lowercases and strips Polish diacritics, including ł', () => {
    expect(normalize('Zwierząt ŁAŃCUCH Ciąży')).toBe('zwierzat lancuch ciazy');
  });
});

describe('stem', () => {
  it('drops inflection endings from longer words only', () => {
    expect(stem('podatek')).toBe('podat');
    expect(stem('zwierzeta')).toBe('zwierz');
    expect(stem('ciazy')).toBe('ciaz');
    expect(stem('rada')).toBe('rad');
    expect(stem('nr')).toBe('nr');
    expect(stem('2690')).toBe('2690');
  });
});

describe('searchVotings', () => {
  it('matches inflected forms', () => {
    expect(searchVotings(index, 'zwierzęta').map((e) => e.num)).toEqual([2, 2]);
    expect(searchVotings(index, 'łańcuch').map((e) => e.num)).toEqual([2]);
  });

  it('matches every word in title or topic, ignoring case and diacritics, newest first', () => {
    expect(searchVotings(index, 'zwierzat').map((e) => [e.sitting, e.num])).toEqual([[2, 2], [1, 2]]);
    expect(searchVotings(index, 'zwierząt łańcuch').map((e) => e.num)).toEqual([2]);
    expect(searchVotings(index, 'ciazy calosc')[0]).toMatchObject({ sitting: 2, num: 1, yes: 220, no: 230 });
  });

  it('respects the limit and an allowed set of positions', () => {
    expect(searchVotings(index, 'pkt', { limit: 1 })).toHaveLength(1);
    expect(searchVotings(index, 'zwierzat', { positions: [0, 1, 2] }).map((e) => e.position)).toEqual([1]);
  });

  it('returns the newest votings for an empty query', () => {
    expect(searchVotings(index, '', { limit: 2 }).map((e) => e.position)).toEqual([3, 2]);
  });
});

describe('vote history', () => {
  it('lists positions where the MEP was seated and reads votes', () => {
    expect(seatedPositions('  YN')).toEqual([2, 3]);
    expect(voteAt('VYN-', 2)).toBe('N');
    expect(voteAt('VY', 5)).toBe(' ');
  });

  it('expands a row into an entry', () => {
    expect(entryAt(index, 0)).toMatchObject({ title: 'Wybór Marszałka', onList: true });
  });
});

describe('decodeVotingIndex', () => {
  it('round-trips the gzipped index the pipeline uploads', async () => {
    const gz = new Uint8Array(gzipSync(JSON.stringify(index)));
    await expect(decodeVotingIndex(gz)).resolves.toEqual(index);
  });
});
