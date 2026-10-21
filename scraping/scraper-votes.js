const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { SEJM_API, fetchJson, mapWithConcurrency } = require("./lib/http.js");
const {
  votingKey,
  compactVoting,
  buildLoyalty,
  sittingsToFetch,
  validateLoyalty,
  buildClubAgreement,
  buildMepClubAgreement,
  buildVotingIndex,
  buildVoteHistory,
} = require("./lib/votes.js");

console.log(`${colors.cyan}${colors.bold}==== SEJM-SCRAPER VOTES (individual votes → party loyalty) ====${colors.reset}\n`);

// Every voting's individual votes, compacted. Kept between runs (Firebase Storage
// in the pipeline, see scripts/pipelineCache.js) so only new votings are fetched.
const CACHE_PATH = path.resolve(__dirname, "votings-cache.json.gz");
const CONCURRENCY = 4;
const SAVE_EVERY = 200;

const loadCache = () =>
  fs.existsSync(CACHE_PATH) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(CACHE_PATH))) : {};

const saveCache = (cache) => fs.writeFileSync(CACHE_PATH, zlib.gzipSync(JSON.stringify(cache)));

(async () => {
  try {
    const cache = loadCache();
    console.log(`${colors.green}✓ Cache has ${Object.keys(cache).length} votings${colors.reset}`);

    const index = await fetchJson(`${SEJM_API}/votings`);
    const sittings = sittingsToFetch(index, cache);
    console.log(`${colors.cyan}Sittings to update: ${sittings.length ? sittings.join(", ") : "none"}${colors.reset}`);

    // Work out exactly which votings are missing (numbering has gaps where votes were cancelled)
    const missing = [];
    for (const sitting of sittings) {
      const list = await fetchJson(`${SEJM_API}/votings/${sitting}`);
      const listed = new Set(list.map((v) => votingKey(sitting, v.votingNumber)));
      for (const key of Object.keys(cache)) {
        if (cache[key].sitting === sitting && !listed.has(key)) delete cache[key];
      }
      for (const v of list) {
        if (!cache[votingKey(sitting, v.votingNumber)]) missing.push([sitting, v.votingNumber]);
      }
    }
    console.log(`${colors.cyan}Votings to fetch: ${missing.length}${colors.reset}`);

    let done = 0;
    let failed = 0;
    await mapWithConcurrency(missing, CONCURRENCY, async ([sitting, num]) => {
      try {
        const detail = await fetchJson(`${SEJM_API}/votings/${sitting}/${num}`);
        cache[votingKey(sitting, num)] = compactVoting(detail);
      } catch (error) {
        failed++;
        console.error(`${colors.red}✗ ${sitting}/${num}: ${error.message}${colors.reset}`);
      }
      // Save progress so an interrupted backfill resumes where it stopped
      if (++done % SAVE_EVERY === 0) {
        saveCache(cache);
        console.log(`${colors.dim}  Progress: ${done}/${missing.length} (saved)${colors.reset}`);
      }
    });
    saveCache(cache);
    if (failed > 0) throw new Error(`${failed} voting(s) failed to download`);

    const loyalty = buildLoyalty(Object.values(cache));
    const errors = validateLoyalty(index, cache, loyalty);
    if (errors.length > 0) {
      errors.forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
      throw new Error("Votes data failed validation");
    }

    fs.writeFileSync(path.resolve(__dirname, "mep-loyalty.json"), JSON.stringify(loyalty, null, 2));
    console.log(`${colors.green}✓ Saved loyalty for ${Object.keys(loyalty).length} MEPs${colors.reset}`);

    // Club agreement: whole term and the last ~6 months (coalitions shift)
    const votings = Object.values(cache);
    const today = new Date();
    const since = new Date(today.getTime() - 182 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const all = buildClubAgreement(votings);
    const recent = buildClubAgreement(votings, since);
    fs.writeFileSync(
      path.resolve(__dirname, "club-agreement.json"),
      JSON.stringify({ computedOn: today.toISOString().slice(0, 10), since, all, recent }, null, 2),
    );

    // Search index + per-MEP vote strings aligned with it. indexId ties the two
    // together so the site can tell if they were written by different runs.
    const votingIndex = buildVotingIndex(votings);
    const last = votingIndex.rows[votingIndex.rows.length - 1];
    const indexId = `${votingIndex.rows.length}:${last[0]}/${last[1]}`;
    const mepIds = JSON.parse(fs.readFileSync(path.resolve(__dirname, "meps.json"), "utf8")).map((m) => m.id);
    const history = buildVoteHistory(votings, mepIds);
    const clubAgreement = buildMepClubAgreement(votings, recent.clubs);
    fs.writeFileSync(path.resolve(__dirname, "voting-index.json"), JSON.stringify({ indexId, ...votingIndex }));
    fs.writeFileSync(
      path.resolve(__dirname, "mep-votes.json"),
      JSON.stringify({ indexId, history, clubAgreement }),
    );
    console.log(
      `${colors.green}✓ Saved index of ${votingIndex.rows.length} votings, vote history and agreement for ${recent.clubs.length} clubs${colors.reset}\n`,
    );
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
