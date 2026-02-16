const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { finished } = require("stream/promises");

console.log(
  `${colors.yellow}${colors.bold}==== SEJM-SCRAPER BASIC ====${colors.reset}`,
);

const getMepsAndSaveToFile = () => {
  fetch("https://api.sejm.gov.pl/sejm/term10/MP", {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((x) => {
      console.log(x);
      fs.writeFileSync("poslowie.json", JSON.stringify(x));
    });
};

const saveMepPhoto = (mepId) => {
  const destination = path.resolve("./img/", `${mepId}.jpeg`);

  // Check if file already exists
  if (fs.existsSync(destination)) {
    console.log(
      `${colors.dim}⏭  Skipping ${mepId} - already exists${colors.reset}`,
    );
    return;
  }

  fetch(`https://api.sejm.gov.pl/sejm/term10/MP/${mepId}/photo-mini`, {
    method: "GET",
  }).then((res) => {
    if (res.status === 404) {
      console.log(`${colors.dim}⏭  Skipping ${mepId} - 404${colors.reset}`);
      return;
    }
    console.log(`${colors.cyan}⬇  Downloading ${mepId}...${colors.reset}`);
    const fileStream = fs.createWriteStream(destination, { flags: "w" });
    finished(Readable.fromWeb(res.body).pipe(fileStream));
    return;
  });
};

const getMepPhotosAndSave = () => {
  console.log("Getting MEP photos and saving to file...");
  for (let i = 1; i <= 600; i++) {
    saveMepPhoto(i);
  }
};

const getVotes = () => {
  fetch("https://api.sejm.gov.pl/sejm/term10/votings/4", {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((x) => {
      console.log(x);
      // fs.writeFileSync("poslowie.json", JSON.stringify(x));
    });
};

console.log(colors.reset); // reset terminal coloring
