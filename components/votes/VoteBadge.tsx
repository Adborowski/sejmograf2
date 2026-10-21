import { VOTE_LABELS, VoteCode } from '@/lib/votings';
import { Badge, BadgeTone } from '@/components/ui';

// API vote values → the one-letter codes used in vote histories
export const API_VOTE_CODES: Record<string, VoteCode> = {
  YES: 'Y',
  NO: 'N',
  ABSTAIN: 'A',
  ABSENT: '-',
  PRESENT: 'P',
  VOTE_VALID: 'V',
};

const TONES: Partial<Record<VoteCode, BadgeTone>> = {
  Y: 'green',
  N: 'red',
  A: 'amber',
};

export function VoteBadge({ code }: { code: VoteCode }) {
  return <Badge tone={TONES[code] ?? 'neutral'}>{VOTE_LABELS[code]}</Badge>;
}
