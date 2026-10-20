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
} = require("./lib/votes.js");

console.log(`${colors.cyan}${colors.bold}==== SEJM-SCRAPER VOTES (individual votes → party loyalty) ====${colors.reset}\n`);

// Every voting's individual votes, compacted. Kept between runs (Firebase Storage
// in the pipeline, see scripts/votesCache.js) so only new votings are fetched.
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
    console.log(`${colors.green}✓ Saved loyalty for ${Object.keys(loyalty).length} MEPs${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
