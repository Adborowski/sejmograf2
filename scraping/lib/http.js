// Shared JSON fetch for Sejm API scrapers: retries transient failures
// (network errors, timeouts, 429, 5xx) with backoff, fails fast on other 4xx.

const SEJM_API = "https://api.sejm.gov.pl/sejm/term10";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (
  url,
  { retries = 3, backoffMs = 1000, timeoutMs = 90_000, fetchImpl = fetch } = {},
) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(backoffMs * 2 ** (attempt - 1));
    try {
      // Without a timeout a hung connection would stall the nightly pipeline
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP ${res.status} for ${url}`);
      if (res.status !== 429 && res.status < 500) break;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

// Run `fn` over `items` with at most `limit` in flight; results keep input order.
const mapWithConcurrency = async (items, limit, fn) => {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};

module.exports = { SEJM_API, fetchJson, sleep, mapWithConcurrency };
