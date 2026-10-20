import { MepLoyalty, Rebellion } from '@/types/mep';

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

const VOTE_LABEL: Record<Rebellion['vote'], string> = {
  YES: 'Za',
  NO: 'Przeciw',
  ABSTAIN: 'Wstrzymanie się',
};

const VOTE_STYLE: Record<Rebellion['vote'], string> = {
  YES: 'bg-green-100 text-green-800',
  NO: 'bg-red-100 text-red-800',
  ABSTAIN: 'bg-gray-100 text-gray-600',
};

const votingUrl = (sitting: number, num: number) =>
  `https://api.sejm.gov.pl/sejm/term10/votings/${sitting}/${num}/pdf`;

interface LoyaltySectionProps {
  loyalty?: MepLoyalty;
}

export function LoyaltySection({ loyalty }: LoyaltySectionProps) {
  // Docs written before the votes step existed have no `loyalty` field
  if (!loyalty) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-1">Lojalność wobec klubu</h3>
      <p className="text-xs text-gray-500 mb-4">
        Jak często poseł głosuje tak jak większość jego klubu (w chwili głosowania). Liczymy głosowania, w których klub miał wyraźną większość.
      </p>

      {loyalty.loyalty === null ? (
        <p className="text-sm text-gray-500">
          {loyalty.cast === 0
            ? 'Brak oddanych głosów w tej kadencji.'
            : 'Głosy oddane poza klubem (niezrzeszeni) — brak linii klubu do porównania.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-2 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{pct(loyalty.loyalty)}</p>
              <p className="text-xs text-gray-500 mt-1">Zgodnie z klubem</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{loyalty.rebellions.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Głosy wbrew klubowi</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{loyalty.abstainRate !== null ? pct(loyalty.abstainRate) : '—'}</p>
              <p className="text-xs text-gray-500 mt-1">Wstrzymania się</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mb-5">
            {loyalty.opposed.toLocaleString()} głosów odwrotnych niż klub
            {' · '}na {loyalty.withLine.toLocaleString()} głosowań
            {loyalty.clubAverage !== null && <> · średnia klubu {loyalty.club}: {pct(loyalty.clubAverage)}</>}
            {loyalty.sejmAverage !== null && <> · średnia Sejmu: {pct(loyalty.sejmAverage)}</>}
          </p>

          {loyalty.recentRebellions.length > 0 && (
            <>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Ostatnie głosy wbrew klubowi</p>
              <ul className="divide-y divide-gray-100">
                {loyalty.recentRebellions.map((r) => (
                  <li key={`${r.sitting}/${r.num}`} className="py-2.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                      <span>{r.date}</span>
                      <span>·</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${VOTE_STYLE[r.vote]}`}>
                        {VOTE_LABEL[r.vote]}
                      </span>
                      <span>
                        klub {r.club}: {VOTE_LABEL[r.clubLine].toLowerCase()}
                      </span>
                    </div>
                    <a
                      href={votingUrl(r.sitting, r.num)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-800 hover:text-blue-600 hover:underline"
                    >
                      {r.topic || r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
