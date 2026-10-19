// Committee memberships and club leadership roles per MEP — pure, no I/O.

// Non-standing committees have very long official names; these are display names.
const COMMITTEE_SHORT_NAMES = {
  NKK: "Komisja Nadzwyczajna ds. zmian w kodyfikacjach",
  NON: "Komisja Nadzwyczajna ds. statusu osoby najbliższej",
  NOZ: "Komisja Nadzwyczajna ds. ochrony zwierząt",
  NPC: "Komisja Nadzwyczajna ds. prawa do przerywania ciąży",
  NSP: "Komisja Nadzwyczajna ds. powodzi z 2024 r.",
  NZC: "Komisja Nadzwyczajna ds. rynku pracy i cudzoziemców",
  SKGK: "Komisja śledcza ds. wyborów kopertowych",
  SKPC: "Komisja śledcza ds. afery wizowej",
  SKPG: "Komisja śledcza ds. Pegasusa",
};

const ROLE_ORDER = { chair: 0, deputy: 1, member: 2 };
const TYPE_ORDER = { INVESTIGATIVE: 0, STANDING: 1, EXTRAORDINARY: 2 };

// "przewodniczący"/"przewodnicząca" → chair; "zastępca/zastępczyni przewodniczącego/ej" → deputy
const classifyCommitteeFunction = (fn) => {
  if (!fn) return "member";
  const f = fn.toLowerCase();
  if (f.startsWith("zastęp")) return "deputy";
  if (f.startsWith("przewodnicząc")) return "chair";
  return "member";
};

// committees: GET /committees, clubs: GET /clubs/{id} for each club.
// Returns { [mepId]: { committees: [...], clubFunction: string | null } }
const buildMepRoles = (committees, clubs) => {
  const roles = {};
  const entry = (id) => (roles[id] ??= { committees: [], clubFunction: null });

  for (const c of committees) {
    for (const m of c.members || []) {
      entry(m.id).committees.push({
        code: c.code,
        name: COMMITTEE_SHORT_NAMES[c.code] || c.name,
        type: c.type,
        role: classifyCommitteeFunction(m.function),
        function: m.function || null,
        joinDate: m.joinDate || null,
      });
    }
  }

  for (const club of clubs) {
    for (const m of club.members || []) {
      if (m.function) entry(m.id).clubFunction = m.function;
    }
  }

  for (const r of Object.values(roles)) {
    r.committees.sort(
      (a, b) =>
        ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
        (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9) ||
        a.name.localeCompare(b.name, "pl"),
    );
  }

  return roles;
};

const validateRoles = (committees, roles) => {
  const errors = [];
  if (!Array.isArray(committees) || committees.length < 30) {
    errors.push(`Only ${committees?.length ?? 0} committees (expected 30+)`);
    return errors;
  }
  const withChair = committees.filter((c) =>
    (c.members || []).some((m) => classifyCommitteeFunction(m.function) === "chair"),
  ).length;
  if (withChair < committees.length * 0.9) {
    errors.push(`Only ${withChair}/${committees.length} committees have a chair — function format changed?`);
  }
  const mepsWithCommittees = Object.values(roles).filter((r) => r.committees.length).length;
  if (mepsWithCommittees < 350) {
    errors.push(`Only ${mepsWithCommittees} MEPs sit on a committee (expected 350+)`);
  }
  return errors;
};

module.exports = {
  COMMITTEE_SHORT_NAMES,
  classifyCommitteeFunction,
  buildMepRoles,
  validateRoles,
};
