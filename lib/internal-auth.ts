import { createHash, timingSafeEqual } from "node:crypto";

function secretsMatch(actual: string, expected: string): boolean {
  // Hashing gives equal-length buffers, which timingSafeEqual requires.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(actual), digest(expected));
}

/**
 * Authorizes internal jobs. Accepts `x-internal-token` for manual runs and
 * `Authorization: Bearer <CRON_SECRET>`, which Vercel Cron sends automatically.
 * An unset secret never matches.
 */
export function isAuthorizedInternalRequest(req: Request): boolean {
  const internalSecret = process.env.WITHDRAWAL_CLEANUP_SECRET;
  const internalToken = req.headers.get("x-internal-token");
  if (internalSecret && internalToken && secretsMatch(internalToken, internalSecret)) {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get("authorization");
  return Boolean(
    cronSecret && authorization && secretsMatch(authorization, `Bearer ${cronSecret}`),
  );
}
