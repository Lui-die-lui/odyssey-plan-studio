import { afterEach, describe, expect, it, vi } from "vitest";

import { isAuthorizedInternalRequest } from "./internal-auth";

const request = (headers: Record<string, string> = {}, url = "https://example.com/job") =>
  new Request(url, { headers });

describe("isAuthorizedInternalRequest", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the internal token header", () => {
    vi.stubEnv("WITHDRAWAL_CLEANUP_SECRET", "internal");
    expect(isAuthorizedInternalRequest(request({ "x-internal-token": "internal" }))).toBe(true);
  });

  it("accepts the Vercel Cron bearer token", () => {
    vi.stubEnv("CRON_SECRET", "cron");
    expect(isAuthorizedInternalRequest(request({ authorization: "Bearer cron" }))).toBe(true);
  });

  it("rejects wrong tokens of any length", () => {
    vi.stubEnv("WITHDRAWAL_CLEANUP_SECRET", "internal");
    vi.stubEnv("CRON_SECRET", "cron");
    expect(isAuthorizedInternalRequest(request({ "x-internal-token": "x" }))).toBe(false);
    expect(isAuthorizedInternalRequest(request({ authorization: "Bearer wrong-token" }))).toBe(false);
    expect(isAuthorizedInternalRequest(request({ authorization: "cron" }))).toBe(false);
  });

  it("ignores tokens in the query string", () => {
    vi.stubEnv("WITHDRAWAL_CLEANUP_SECRET", "internal");
    const url = "https://example.com/job?token=internal";
    expect(isAuthorizedInternalRequest(request({}, url))).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("WITHDRAWAL_CLEANUP_SECRET", "");
    vi.stubEnv("CRON_SECRET", "");
    expect(isAuthorizedInternalRequest(request({ "x-internal-token": "" }))).toBe(false);
    expect(isAuthorizedInternalRequest(request({ authorization: "Bearer " }))).toBe(false);
  });
});
