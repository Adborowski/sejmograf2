const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { SEJM_API, fetchJson, fetchText, mapWithConcurrency, sleep } = require("./lib/http.js");
const {
  listSittingDays,
  buildMepSpeeches,
  validateSpeeches,
  statementKey,
  parseStatementTopic,
  topicsToFetch,
  attachTopics,
} = require("./lib/speeches.js");

console.log(`${colors.cyan}${colors.bold}==== SEJM-SCRAPER SPEECHES (plenary transcripts) ====${colors.reset}\n`);

// The API is occasionally slow (single transcripts can take 30s+); keep it gentle
const CONCURRENCY = 4;

// Topics of recent statements, cached between runs (Firebase Storage in the
// pipeline, see scripts/pipelineCache.js). Topics never change, so only new
// statements are fetched. Sejm renders a statement's HTML on first request,
// which can take ~50s, so each run fetches at most MAX_TOPICS; the rest
// follow on later runs.
const TOPICS_PATH = path.resolve(__dirname, "statement-topics.json.gz");
const MAX_TOPICS = 600;
const SAVE_TOPICS_EVERY = 50;

const loadTopics = () =>
  fs.existsSync(TOPICS_PATH) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(TOPICS_PATH))) : {};
const saveTopics = (topics) => fs.writeFileSync(TOPICS_PATH, zlib.gzipSync(JSON.stringify(topics)));

const MAX_TOPICS_ARG = process.argv.find((a) => a.startsWith("--max-topics="));
const maxTopics = MAX_TOPICS_ARG ? Number(MAX_TOPICS_ARG.split("=")[1]) : MAX_TOPICS;

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
    // Second pass for days that still failed: one at a time, after a pause
    const failedDays = expectedDays.filter((_, i) => !results[i]);
    if (failedDays.length > 0) {
      console.log(`${colors.yellow}Retrying ${failedDays.length} failed day(s) in 30s…${colors.reset}`);
      await sleep(30_000);
      for (const { proceeding, date } of failedDays) {
        try {
          const t = await fetchJson(`${SEJM_API}/proceedings/${proceeding}/${date}/transcripts`);
          results[expectedDays.findIndex((d) => d.proceeding === proceeding && d.date === date)] =
            { proceeding, date, statements: t.statements || [] };
          console.log(`${colors.green}✓ ${proceeding}/${date} on retry${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}✗ ${proceeding}/${date} again: ${error.message}${colors.reset}`);
        }
      }
    }
    const days = results.filter(Boolean);

    const speeches = buildMepSpeeches(days);
    const errors = validateSpeeches(expectedDays, days, speeches);
    if (errors.length > 0) {
      errors.forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
      throw new Error("Speeches data failed validation");
    }

    // Topics for recent statements. Failures aren't cached, so they're retried next run.
    const topics = loadTopics();
    const missing = topicsToFetch(speeches, topics);
    const batch = missing.slice(0, maxTopics);
    console.log(
      `${colors.cyan}Statement topics: ${Object.keys(topics).length} cached, ${missing.length} missing, fetching ${batch.length}${colors.reset}`,
    );
    let fetched = 0;
    let topicFailures = 0;
    await mapWithConcurrency(batch, CONCURRENCY, async (s) => {
      try {
        const html = await fetchText(`${SEJM_API}/proceedings/${s.proceeding}/${s.date}/transcripts/${s.num}`);
        topics[statementKey(s)] = parseStatementTopic(html);
      } catch {
        topicFailures++;
      }
      if (++fetched % SAVE_TOPICS_EVERY === 0) {
        saveTopics(topics);
        console.log(`${colors.dim}  Topics: ${fetched}/${batch.length} (saved)${colors.reset}`);
      }
    });
    saveTopics(topics);
    if (topicFailures > 0) {
      console.log(`${colors.yellow}⚠  ${topicFailures} topic(s) failed — will retry next run${colors.reset}`);
    }
    attachTopics(speeches, topics);

    fs.writeFileSync(path.resolve(__dirname, "mep-speeches.json"), JSON.stringify(speeches, null, 2));
    console.log(`${colors.green}✓ Saved speeches for ${Object.keys(speeches).length} MEPs${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
