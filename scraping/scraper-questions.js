const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { SEJM_API, fetchJson, sleep } = require("./lib/http.js");
const {
  summarizeItem,
  buildMepActivity,
  buildMinistryStats,
  validateQuestions,
} = require("./lib/questions.js");

console.log(
  `${colors.cyan}${colors.bold}==== SEJM-SCRAPER QUESTIONS (interpellations + written questions) ====${colors.reset}\n`,
);

const PAGE_SIZE = 500;

// Fetch every page of a list endpoint, de-duplicated by `num`
const fetchAll = async (endpoint) => {
  const byNum = new Map();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchJson(`${SEJM_API}/${endpoint}?limit=${PAGE_SIZE}&offset=${offset}`);
    page.forEach((item) => byNum.set(item.num, item));
    if (page.length < PAGE_SIZE) break;
    await sleep(100);
  }
  return [...byNum.values()];
};

(async () => {
  try {
    const interpellations = await fetchAll("interpellations");
    console.log(`${colors.green}✓ Fetched ${interpellations.length} interpellations${colors.reset}`);
    const writtenQuestions = await fetchAll("writtenQuestions");
    console.log(`${colors.green}✓ Fetched ${writtenQuestions.length} written questions${colors.reset}`);

    const items = [
      ...interpellations.map((i) => summarizeItem(i, "interpellation")),
      ...writtenQuestions.map((i) => summarizeItem(i, "writtenQuestion")),
    ];
    const activity = buildMepActivity(items);
    const today = new Date().toISOString().slice(0, 10);
    const ministries = buildMinistryStats(items, today);

    const errors = validateQuestions(interpellations, writtenQuestions, activity);
    if (ministries.length < 15) errors.push(`Only ${ministries.length} ministries in ranking (expected 15+)`);
    if (errors.length > 0) {
      errors.forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
      throw new Error("Questions data failed validation");
    }

    fs.writeFileSync(path.resolve(__dirname, "mep-activity.json"), JSON.stringify(activity, null, 2));
    fs.writeFileSync(
      path.resolve(__dirname, "ministry-stats.json"),
      JSON.stringify({ computedOn: today, ministries }, null, 2),
    );
    console.log(
      `${colors.green}✓ Saved activity for ${Object.keys(activity).length} MEPs and ${ministries.length} ministries${colors.reset}\n`,
    );
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
