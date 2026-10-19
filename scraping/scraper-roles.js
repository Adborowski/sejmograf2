const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { SEJM_API, fetchJson } = require("./lib/http.js");
const { buildMepRoles, validateRoles } = require("./lib/roles.js");

console.log(
  `${colors.cyan}${colors.bold}==== SEJM-SCRAPER ROLES (committees + club functions) ====${colors.reset}\n`,
);

(async () => {
  try {
    const committees = await fetchJson(`${SEJM_API}/committees`);
    console.log(`${colors.green}✓ Fetched ${committees.length} committees${colors.reset}`);

    const clubList = await fetchJson(`${SEJM_API}/clubs`);
    const clubs = [];
    for (const { id } of clubList) {
      clubs.push(await fetchJson(`${SEJM_API}/clubs/${encodeURIComponent(id)}`));
    }
    console.log(`${colors.green}✓ Fetched ${clubs.length} clubs${colors.reset}`);

    const roles = buildMepRoles(committees, clubs);
    const errors = validateRoles(committees, roles);
    if (errors.length > 0) {
      errors.forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
      throw new Error("Roles data failed validation");
    }

    const outputPath = path.resolve(__dirname, "mep-roles.json");
    fs.writeFileSync(outputPath, JSON.stringify(roles, null, 2));
    console.log(
      `${colors.green}✓ Saved roles for ${Object.keys(roles).length} MEPs to mep-roles.json${colors.reset}\n`,
    );
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
