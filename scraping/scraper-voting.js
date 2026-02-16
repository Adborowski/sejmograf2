const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { finished } = require("stream/promises");

console.log(
  `${colors.cyan}${colors.bold}==== SEJM-SCRAPER VOTING ====${colors.reset}`,
);

// dummy function as a warm up
const getMepVotingStats = ({ mepId }) => {
  fetch(`https://api.sejm.gov.pl/sejm/term10/MP/${mepId}/votings/stats`, {
    method: "GET",
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {});
};

getData();
