const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { SEJM_API, fetchJson, mapWithConcurrency } = require("./lib/http.js");
const { listSittingDays, buildMepSpeeches, validateSpeeches } = require("./lib/speeches.js");

console.log(`${colors.cyan}${colors.bold}==== SEJM-SCRAPER SPEECHES (plenary transcripts) ====${colors.reset}\n`);

// The API is occasionally slow (single transcripts can take 30s+); keep it gentle
const CONCURRENCY = 4;

(async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const expectedDays = listSittingDays(await fetchJson(`${SEJM_API}/proceedings`), today);
    console.log(`${colors.green}✓ ${expectedDays.length} sitting days so far${colors.reset}`);

    let done = 0;
    const results = await mapWithConcurrency(expectedDays, CONCURRENCY, async ({ proceeding, date }) => {
      try {
        const t = await fetchJson(`${SEJM_API}/proceedings/${proceeding}/${date}/transcripts`);
        return { proceeding, date, statements: t.statements || [] };
      } catch (error) {
        console.error(`${colors.red}✗ ${proceeding}/${date}: ${error.message}${colors.reset}`);
        return null;
      } finally {
        if (++done % 25 === 0 || done === expectedDays.length) {
          console.log(`${colors.dim}  Progress: ${done}/${expectedDays.length}${colors.reset}`);
        }
      }
    });
    const days = results.filter(Boolean);

    const speeches = buildMepSpeeches(days);
    const errors = validateSpeeches(expectedDays, days, speeches);
    if (errors.length > 0) {
      errors.forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
      throw new Error("Speeches data failed validation");
    }

    fs.writeFileSync(path.resolve(__dirname, "mep-speeches.json"), JSON.stringify(speeches, null, 2));
    console.log(`${colors.green}✓ Saved speeches for ${Object.keys(speeches).length} MEPs${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
