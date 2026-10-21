import { MepSpeeches } from '@/types/mep';
import { statementUrl } from '@/lib/sejmApi';
import { Badge, Card, SectionLabel, Stat, StatGrid } from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/format';

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} godz. ${minutes % 60} min`;
};

const KIND_LABEL: Record<MepSpeeches['recent'][number]['kind'], string | null> = {
  speech: null,
  written: 'Na piśmie',
  official: 'Jako członek rządu',
};

interface SpeechesSectionProps {
  speeches?: MepSpeeches;
}

export function SpeechesSection({ speeches }: SpeechesSectionProps) {
  // Docs written before the speeches step existed have no `speeches` field
  if (!speeches) return null;

  const total = speeches.speeches + speeches.official + speeches.written;

  return (
    <Card id="wystapienia" title="Wystąpienia na sali plenarnej">
      {total === 0 ? (
        <p className="text-sm text-slate-500">Brak wystąpień na posiedzeniach Sejmu w tej kadencji.</p>
      ) : (
        <>
          <StatGrid>
            <Stat emphasis label="Wystąpienia" value={formatNumber(speeches.speeches)} hint={speeches.rapporteur > 0 ? `${speeches.rapporteur} jako sprawozdawca` : undefined} />
            <Stat label="Łączny czas" value={formatDuration(speeches.seconds)} />
            <Stat
              label="Dni z wystąpieniem"
              value={formatNumber(speeches.daysSpoken)}
              hint={[
                speeches.written > 0 && `${speeches.written} na piśmie`,
                speeches.official > 0 && `${speeches.official} jako członek rządu`,
              ].filter(Boolean).join(' · ') || undefined}
            />
          </StatGrid>

          <div className="mt-6">
            <SectionLabel>Ostatnie</SectionLabel>
            <ul className="divide-y divide-slate-100">
              {speeches.recent.map((r) => (
                <li key={`${r.proceeding}/${r.date}/${r.num}`} className="py-3">
                  <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{formatDate(r.date)} · posiedzenie {r.proceeding}</span>
                    {KIND_LABEL[r.kind] && <Badge>{KIND_LABEL[r.kind]}</Badge>}
                  </p>
                  <a
                    href={statementUrl(r.proceeding, r.date, r.num)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-800 hover:text-blue-700 hover:underline line-clamp-2"
                  >
                    {/* Topics are fetched by the nightly pipeline; a new statement may not have one yet */}
                    {r.topic || 'Wystąpienie — zobacz treść'}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}
