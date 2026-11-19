import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { ADMIN_HEADER_NAME } from "../shared/constants.js";
import type { AppContext } from "./context.js";
import { ApiError, unauthorized } from "./errors.js";
import { clientIp, enforceRateLimit } from "./http.js";
import type { TokenBucketRateLimiter } from "./rate-limit.js";

/**
 * Compares fixed-length SHA-256 digests so the comparison does not leak the
 * configured token through response timing or length differences.
 */
export function constantTimeEqual(provided: string, expected: string): boolean {
  const providedDigest = createHash("sha256").update(provided, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

export function createAdminGuard(
  ctx: AppContext,
  limiter: TokenBucketRateLimiter,
): RequestHandler {
  return (req, res, next) => {
    const expected = ctx.config.adminToken;
    if (expected === null) {
      next(
        new ApiError(
          503,
          "ADMIN_NOT_CONFIGURED",
          "Yönetici anahtarı yapılandırılmamış.",
        ),
      );
      return;
    }

    try {
      enforceRateLimit(limiter, clientIp(req), res);
    } catch (error) {
      next(error);
      return;
    }

    const provided = req.get(ADMIN_HEADER_NAME);
    if (!provided || !constantTimeEqual(provided, expected)) {
      next(unauthorized("Yönetici anahtarı geçersiz."));
      return;
    }

    next();
  };
}
