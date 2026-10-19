import { CommitteeMembership } from '@/types/mep';

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const committeeUrl = (code: string) =>
  `https://www.sejm.gov.pl/Sejm10.nsf/agent.xsp?symbol=KOMISJAST&NrKadencji=10&KodKom=${code}`;

const TYPE_LABELS: Record<CommitteeMembership['type'], string | null> = {
  INVESTIGATIVE: 'Śledcza',
  EXTRAORDINARY: 'Nadzwyczajna',
  STANDING: null,
};

const ROLE_STYLES: Record<CommitteeMembership['role'], string> = {
  chair: 'bg-blue-600 text-white',
  deputy: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-600',
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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Funkcje i komisje</h3>

      {clubFunction && (
        <p className="text-sm text-gray-700 mb-4">
          <span className="font-semibold">{capitalizeFirst(clubFunction)}</span> klubu {club}
        </p>
      )}

      {committees.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {committees.map((c) => (
            <li key={c.code} className="py-2.5 flex items-center justify-between gap-3">
              <a
                href={committeeUrl(c.code)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-800 hover:text-blue-600 hover:underline min-w-0"
              >
                {c.name}
                {TYPE_LABELS[c.type] && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 align-middle">
                    {TYPE_LABELS[c.type]}
                  </span>
                )}
              </a>
              <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[c.role]}`}>
                {c.function ? capitalizeFirst(c.function) : 'Członek'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Nie zasiada w żadnej komisji sejmowej.</p>
      )}
    </div>
  );
}
