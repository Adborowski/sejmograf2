// Direct browser calls to the public Sejm API (CORS is allowed) for data
// too large to keep in Firestore, such as each MEP's full question list.

const SEJM_API = 'https://api.sejm.gov.pl/sejm/term10';

export type QuestionType = 'interpellation' | 'writtenQuestion';

export interface QuestionItem {
  type: QuestionType;
  num: number;
  title: string;
  receiptDate: string;
  recipients: string[];
  status: 'answered' | 'extended' | 'pending';
  bodyUrl: string | null; // full question text (HTML)
  answer: { url: string; isPdf: boolean } | null;
}

interface ApiLink {
  rel: string;
  href: string;
}

interface ApiQuestion {
  num: number;
  title: string;
  receiptDate: string;
  recipientDetails?: Array<{ name: string }>;
  replies?: Array<{
    prolongation: boolean;
    attachments?: Array<{ URL: string; name: string }>;
    links?: ApiLink[];
  }>;
  links?: ApiLink[];
}

const linkFor = (links: ApiLink[] | undefined, rel: string) =>
  links?.find((l) => l.rel === rel)?.href ?? null;

const ENDPOINTS: Record<QuestionType, string> = {
  interpellation: 'interpellations',
  writtenQuestion: 'writtenQuestions',
};

const toItem = (type: QuestionType, q: ApiQuestion): QuestionItem => {
  const replies = q.replies ?? [];
  // Most answers are a PDF attachment; the rest only have an HTML body
  const firstAnswer = replies.find((r) => !r.prolongation);
  const pdf = firstAnswer?.attachments?.find((a) => a.name.toLowerCase().endsWith('.pdf'));
  const answerBody = linkFor(firstAnswer?.links, 'body');
  return {
    type,
    num: q.num,
    title: q.title,
    receiptDate: q.receiptDate,
    recipients: (q.recipientDetails ?? []).map((r) => r.name),
    // A reply with prolongation: true only announces a deadline extension
    status: replies.some((r) => !r.prolongation) ? 'answered' : replies.length ? 'extended' : 'pending',
    bodyUrl: linkFor(q.links, 'body'),
    answer: pdf ? { url: pdf.URL, isPdf: true } : answerBody ? { url: answerBody, isPdf: false } : null,
  };
};

/**
 * Latest interpellations and written questions signed by an MEP, newest first.
 */
export const getRecentQuestions = async (mepId: number, count = 10): Promise<QuestionItem[]> => {
  const lists = await Promise.all(
    (Object.keys(ENDPOINTS) as QuestionType[]).map(async (type) => {
      const res = await fetch(`${SEJM_API}/${ENDPOINTS[type]}?from=${mepId}&limit=${count}&sort_by=-receiptDate`);
      if (!res.ok) throw new Error(`Sejm API: HTTP ${res.status}`);
      const data: ApiQuestion[] = await res.json();
      return data.map((q) => toItem(type, q));
    }),
  );
  return lists
    .flat()
    .sort((a, b) => b.receiptDate.localeCompare(a.receiptDate) || b.num - a.num)
    .slice(0, count);
};

/**
 * URL of one plenary statement's full text (HTML).
 */
export const statementUrl = (proceeding: number, date: string, num: number) =>
  `${SEJM_API}/proceedings/${proceeding}/${date}/transcripts/${num}`;


export interface VotingDetail {
  sitting: number;
  num: number;
  date: string;
  title: string;
  topic: string | null;
  kind: string;
  yes: number;
  no: number;
  abstain: number;
  notParticipating: number;
  // Motion passed as worded (e.g. for Senate amendments the motion is to reject them)
  passed: boolean | null;
  pdfUrl: string;
  votes: Array<{ id: number; name: string; club: string; vote: string }>;
}

interface ApiVotingDetail {
  sitting: number;
  votingNumber: number;
  date: string;
  title: string;
  topic?: string;
  kind: string;
  yes: number;
  no: number;
  abstain: number;
  notParticipating: number;
  majorityVotes?: number;
  votes?: Array<{ MP: number; firstName: string; lastName: string; club: string; vote: string }>;
}

/**
 * One voting with every MEP's vote, live from the Sejm API.
 */
export const getVotingDetail = async (sitting: number, num: number): Promise<VotingDetail> => {
  const res = await fetch(`${SEJM_API}/votings/${sitting}/${num}`);
  if (!res.ok) throw new Error(`Sejm API: HTTP ${res.status}`);
  const d: ApiVotingDetail = await res.json();
  return {
    sitting: d.sitting,
    num: d.votingNumber,
    date: d.date,
    title: d.title,
    topic: d.topic || null,
    kind: d.kind,
    yes: d.yes,
    no: d.no,
    abstain: d.abstain,
    notParticipating: d.notParticipating,
    passed: d.kind === 'ELECTRONIC' && d.majorityVotes != null ? d.yes >= d.majorityVotes : null,
    pdfUrl: `${SEJM_API}/votings/${sitting}/${num}/pdf`,
    votes: (d.votes ?? []).map((v) => ({
      id: v.MP,
      name: `${v.firstName} ${v.lastName}`,
      club: v.club,
      vote: v.vote,
    })),
  };
};
