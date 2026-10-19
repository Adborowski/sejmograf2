// Sanity checks run before anything is written to Firestore.
// The upload overwrites production docs, so a bad API response (empty list,
// changed shape) must stop the pipeline rather than wipe the site's data.

const SEJM_SEATS = 460;

const validateMeps = (meps) => {
  const errors = [];

  if (!Array.isArray(meps)) {
    return ["MEP data is not an array"];
  }

  // Term 10 has 460 seats plus MPs who left mid-term
  if (meps.length < SEJM_SEATS) {
    errors.push(`Only ${meps.length} MEPs (expected at least ${SEJM_SEATS})`);
  }

  const active = meps.filter((m) => m.active).length;
  if (active < SEJM_SEATS - 10 || active > SEJM_SEATS) {
    errors.push(`${active} active MEPs (expected ~${SEJM_SEATS})`);
  }

  const seen = new Set();
  for (const mep of meps) {
    const label = `MEP ${mep.id ?? "?"}`;
    if (!Number.isInteger(mep.id)) errors.push(`${label}: missing numeric id`);
    else if (seen.has(mep.id)) errors.push(`${label}: duplicate id`);
    seen.add(mep.id);

    if (!mep.firstName || !mep.lastName) errors.push(`${label}: missing name`);
    if (mep.active && !mep.club) errors.push(`${label}: active but no club`);

    const rate = mep.attendanceRate;
    if (rate !== null && rate !== undefined && !(rate >= 0 && rate <= 1)) {
      errors.push(`${label}: attendanceRate ${rate} out of range`);
    }
    if (mep.totalVoted > mep.totalVotings) {
      errors.push(`${label}: voted more than total votings`);
    }
  }

  // Attendance data missing for most MPs means the stats fetch failed
  const withStats = meps.filter((m) => m.totalVotings > 0).length;
  if (withStats < SEJM_SEATS * 0.9) {
    errors.push(`Only ${withStats} MEPs have voting stats`);
  }

  return errors;
};

module.exports = { validateMeps, SEJM_SEATS };
