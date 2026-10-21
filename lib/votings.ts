// Voting search index (stats/votings_index) and per-MEP vote strings
// (meps/{id}.voteHistory). Pure helpers — no I/O — so they can be unit tested.

export type VoteCode = 'Y' | 'N' | 'A' | '-' | 'P' | 'V' | ' ' | '?';

export interface VotingIndex {
  indexId: string;
  titles: string[];
  // [sitting, num, date, titleIndex, topic, yes, no, abstain, onList]
  rows: Array<[number, number, string, number, string, number, number, number, 0 | 1]>;
}

export interface VotingEntry {
  position: number; // row position — the index into a vote history string
  sitting: number;
  num: number;
  date: string;
  title: string;
  topic: string;
  yes: number;
  no: number;
  abstain: number;
  onList: boolean;
}

export const VOTE_LABELS: Record<VoteCode, string> = {
  Y: 'Za',
  N: 'Przeciw',
  A: 'Wstrzymanie się',
  '-': 'Nieobecność',
  P: 'Obecność bez głosu',
  V: 'Głos oddany (wybory)',
  ' ': 'Nie był(a) posłem',
  '?': 'Nieznany',
};

export const entryAt = (index: VotingIndex, position: number): VotingEntry => {
  const [sitting, num, date, titleIndex, topic, yes, no, abstain, onList] = index.rows[position];
  return { position, sitting, num, date, title: index.titles[titleIndex], topic, yes, no, abstain, onList: onList === 1 };
};

// Lowercase and strip Polish diacritics, so "aborcja" matches "Aborcja" and "zwierzat" matches "zwierząt"
export const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// Polish inflects heavily ("podatek" → "podatku", "podatkowej"; "zwierzęta" →
// "zwierząt"), so longer query words match by a stem with the ending dropped.
// Words of 3 letters or fewer must match as typed.
export const stem = (word: string) => {
  if (/\d/.test(word)) return word; // print numbers ("druk nr 2690") must match exactly
  if (word.length >= 8) return word.slice(0, -3);
  if (word.length >= 6) return word.slice(0, -2);
  if (word.length >= 4) return word.slice(0, -1); // "rada" → "rad" (rady, radzie)
  return word;
};

/**
 * Votings whose title or topic contains (the stem of) every word of `query`, newest first.
 * `positions` limits the search (e.g. to votings an MEP took part in).
 */
export const searchVotings = (
  index: VotingIndex,
  query: string,
  { limit = 20, positions }: { limit?: number; positions?: number[] } = {},
): VotingEntry[] => {
  const words = normalize(query).split(/\s+/).filter(Boolean).map(stem);
  const normalizedTitles = index.titles.map(normalize);
  const candidates = positions ?? index.rows.map((_, i) => i);
  const results: VotingEntry[] = [];
  // Rows are in sitting/num order, so walking backwards gives newest first
  for (let k = candidates.length - 1; k >= 0 && results.length < limit; k--) {
    const position = candidates[k];
    const row = index.rows[position];
    const haystack = `${normalizedTitles[row[3]]} ${normalize(row[4])}`;
    if (words.every((w) => haystack.includes(w))) results.push(entryAt(index, position));
  }
  return results;
};

/** Positions of votings the MEP was seated for, in index order */
export const seatedPositions = (votes: string): number[] => {
  const positions: number[] = [];
  for (let i = 0; i < votes.length; i++) if (votes[i] !== ' ') positions.push(i);
  return positions;
};

export const voteAt = (votes: string, position: number): VoteCode => (votes[position] ?? ' ') as VoteCode;

/** Decompress the gzipped index stored in Firestore (browser DecompressionStream) */
export const decodeVotingIndex = async (gz: Uint8Array): Promise<VotingIndex> => {
  const stream = new Blob([gz as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
};
