const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { validateMeps } = require("./lib/validate.js");

console.log(
  `${colors.cyan}${colors.bold}==== VALIDATE MEP DATA ====${colors.reset}\n`,
);

const dataPath = path.resolve(__dirname, "mep-voting-aggregated.json");
const meps = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const errors = validateMeps(meps);

if (errors.length > 0) {
  console.error(
    `${colors.red}${colors.bold}✗ ${errors.length} problem(s) — aborting before upload:${colors.reset}`,
  );
  errors.slice(0, 30).forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
  process.exit(1);
}

console.log(`${colors.green}✓ ${meps.length} MEPs look valid${colors.reset}\n`);
