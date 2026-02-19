/**
 * Shared club color configuration.
 *
 * Colors are assigned by alphabetical position from CLUB_PALETTE so they stay
 * consistent across every component that renders club data.
 *
 * To switch to realistic party colors later, add explicit entries to
 * CLUB_COLOR_OVERRIDES — those take precedence over the palette fallback.
 */

export const CLUB_PALETTE = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
];

/**
 * Explicit overrides — add realistic party colors here when ready.
 * Keys must match the club name strings stored in Firestore.
 *
 * Example:
 *   'KO': '#f97316',
 *   'PiS': '#1e3a8a',
 */
export const CLUB_COLOR_OVERRIDES: Record<string, string> = {};

const SEJM_API_BASE = 'https://api.sejm.gov.pl/sejm/term10/clubs';

/**
 * Logo URLs from the Sejm open API.
 * Keys match the club id strings used both in the API and in Firestore.
 */
export const CLUB_LOGOS: Record<string, string> = {
  CENTRUM:         `${SEJM_API_BASE}/CENTRUM/logo`,
  Demokracja:      `${SEJM_API_BASE}/Demokracja/logo`,
  KO:              `${SEJM_API_BASE}/KO/logo`,
  Konfederacja:    `${SEJM_API_BASE}/Konfederacja/logo`,
  Konfederacja_KP: `${SEJM_API_BASE}/Konfederacja_KP/logo`,
  Lewica:          `${SEJM_API_BASE}/Lewica/logo`,
  'niez.':         `${SEJM_API_BASE}/niez./logo`,
  PiS:             `${SEJM_API_BASE}/PiS/logo`,
  Polska2050:      `${SEJM_API_BASE}/Polska2050/logo`,
  'PSL-TD':        `${SEJM_API_BASE}/PSL-TD/logo`,
  Razem:           `${SEJM_API_BASE}/Razem/logo`,
};

/**
 * Human-readable full names for each club ID.
 * Derived from https://api.sejm.gov.pl/sejm/term10/clubs — shortened where the
 * official name is excessively long.
 */
export const CLUB_FULL_NAMES: Record<string, string> = {
  CENTRUM:         'Klub Centrum',
  Demokracja:      'Demokracja Bezpośrednia',
  KO:              'Koalicja Obywatelska',
  Konfederacja:    'Konfederacja',
  Konfederacja_KP: 'Konfederacja Korony Polskiej',
  Lewica:          'Lewica',
  'niez.':         'Niezrzeszeni',
  PiS:             'Prawo i Sprawiedliwość',
  Polska2050:      'Polska 2050',
  'PSL-TD':        'PSL – Trzecia Droga',
  Razem:           'Razem',
};

/**
 * Returns a stable { clubName → color } map for the given sorted club list.
 * Falls back to palette order when no explicit override is defined.
 */
export function getClubColorMap(sortedClubs: string[]): Record<string, string> {
  return Object.fromEntries(
    sortedClubs.map((club, i) => [
      club,
      CLUB_COLOR_OVERRIDES[club] ?? CLUB_PALETTE[i % CLUB_PALETTE.length],
    ])
  );
}
