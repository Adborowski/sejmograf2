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

/**
 * Agenda item a statement was made under, read from its transcript HTML
 * (<p class="punkt-tytul">). Null if the page has no agenda item.
 */
export const getStatementTopic = async (proceeding: number, date: string, num: number): Promise<string | null> => {
  const res = await fetch(statementUrl(proceeding, date, num));
  if (!res.ok) throw new Error(`Sejm API: HTTP ${res.status}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const topic = doc.querySelector('.punkt-tytul')?.textContent?.replace(/\s+/g, ' ').trim();
  return topic || null;
};
