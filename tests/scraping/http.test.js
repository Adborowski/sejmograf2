import { describe, it, expect, vi } from "vitest";
import { fetchJson, fetchText, mapWithConcurrency } from "../../scraping/lib/http.js";

const response = (status, body = {}) => ({ ok: status < 400, status, json: async () => body, text: async () => String(body) });

describe("fetchJson", () => {
  it("retries 5xx and returns the eventual success", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response(503))
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(response(200, { ok: 1 }));
    await expect(fetchJson("u", { fetchImpl, backoffMs: 0 })).resolves.toEqual({ ok: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a 404", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(404));
    await expect(fetchJson("u", { fetchImpl, backoffMs: 0 })).rejects.toThrow("HTTP 404");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("gives up after the retry budget", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(500));
    await expect(fetchJson("u", { fetchImpl, retries: 2, backoffMs: 0 })).rejects.toThrow("HTTP 500");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});

describe("fetchJson timeout", () => {
  it("aborts a hung request and retries", async () => {
    const fetchImpl = vi.fn()
      .mockImplementationOnce((_url, { signal }) =>
        new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason))),
      )
      .mockResolvedValueOnce(response(200, { ok: 1 }));
    await expect(fetchJson("u", { fetchImpl, backoffMs: 0, timeoutMs: 10 })).resolves.toEqual({ ok: 1 });
  });
});

describe("mapWithConcurrency", () => {
  it("keeps input order and never exceeds the limit", async () => {
    let inFlight = 0;
    let peak = 0;
    const results = await mapWithConcurrency([30, 10, 20, 5, 15], 2, async (ms, i) => {
      peak = Math.max(peak, ++inFlight);
      await new Promise((r) => setTimeout(r, ms));
      inFlight--;
      return i;
    });
    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(peak).toBe(2);
  });
});

describe("fetchText", () => {
  it("returns the body as text, with the same retries", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response(502)).mockResolvedValueOnce(response(200, "<html></html>"));
    await expect(fetchText("u", { fetchImpl, backoffMs: 0 })).resolves.toBe("<html></html>");
  });
});
