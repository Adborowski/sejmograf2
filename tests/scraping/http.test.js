import { describe, it, expect, vi } from "vitest";
import { fetchJson } from "../../scraping/lib/http.js";

const response = (status, body = {}) => ({ ok: status < 400, status, json: async () => body });

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
