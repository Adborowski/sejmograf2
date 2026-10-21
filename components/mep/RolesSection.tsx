import { CommitteeMembership } from '@/types/mep';
import { Badge, BadgeTone, Card } from '@/components/ui';

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const committeeUrl = (code: string) =>
  `https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=KOMISJAST&NrKadencji=10&KodKom=${code}`;

const TYPE_LABELS: Record<CommitteeMembership['type'], string | null> = {
  INVESTIGATIVE: 'Śledcza',
  EXTRAORDINARY: 'Nadzwyczajna',
  STANDING: null,
};

const ROLE_TONES: Record<CommitteeMembership['role'], BadgeTone> = {
  chair: 'solid',
  deputy: 'blue',
  member: 'neutral',
};

interface RolesSectionProps {
  committees?: CommitteeMembership[];
  clubFunction?: string | null;
  club?: string;
}

export function RolesSection({ committees, clubFunction, club }: RolesSectionProps) {
  // Docs written before the roles step existed have no `committees` field
  if (committees === undefined) return null;

  return (
    <Card title="Funkcje i komisje">
      {clubFunction && (
        <p className="text-sm text-slate-700 mb-4 rounded-lg bg-slate-50 px-3 py-2">
          <span className="font-semibold">{capitalizeFirst(clubFunction)}</span> klubu {club}
        </p>
      )}

      {committees.length > 0 ? (
        <ul className="space-y-3">
          {committees.map((c) => (
            <li key={c.code}>
              <a
                href={committeeUrl(c.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-800 hover:text-blue-700 hover:underline"
              >
                {c.name}
              </a>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge tone={ROLE_TONES[c.role]}>{c.function ? capitalizeFirst(c.function) : 'Członek'}</Badge>
                {TYPE_LABELS[c.type] && <Badge tone="amber">{TYPE_LABELS[c.type]}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">Brak członkostwa w komisjach sejmowych.</p>
      )}
    </Card>
  );
}
