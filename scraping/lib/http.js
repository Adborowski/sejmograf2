// Shared JSON fetch for Sejm API scrapers: retries transient failures
// (network errors, 429, 5xx) with backoff, fails fast on other 4xx.

const SEJM_API = "https://api.sejm.gov.pl/sejm/term10";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url, { retries = 3, backoffMs = 1000, fetchImpl = fetch } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(backoffMs * 2 ** (attempt - 1));
    try {
      const res = await fetchImpl(url);
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP ${res.status} for ${url}`);
      if (res.status !== 429 && res.status < 500) break;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

module.exports = { SEJM_API, fetchJson, sleep };
