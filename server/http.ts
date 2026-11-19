import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError as ApiErrorClass, validationError } from "./errors.js";
import type { TokenBucketRateLimiter } from "./rate-limit.js";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type RouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => unknown;

export function asyncHandler(handler: RouteHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}

export function requireJsonForMutations(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  if (!req.is("application/json")) {
    const contentLength = req.headers["content-length"];
    const hasBody =
      (contentLength !== undefined && Number(contentLength) > 0) ||
      req.headers["transfer-encoding"] !== undefined;

    if (hasBody) {
      next(
        new ApiErrorClass(
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          "İstek gövdesi application/json olmalı.",
        ),
      );
      return;
    }
  }

  next();
}

export function enforceRateLimit(
  limiter: TokenBucketRateLimiter,
  key: string,
  res: Response,
): void {
  const decision = limiter.take(key);
  if (decision.allowed) return;

  res.setHeader(
    "Retry-After",
    String(Math.max(1, Math.ceil(decision.retryAfterMs / 1000))),
  );
  throw new ApiErrorClass(
    429,
    "RATE_LIMITED",
    "Çok fazla istek. Lütfen biraz sonra tekrar dene.",
    { retryAfterMs: decision.retryAfterMs },
  );
}

export function clientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

/** Returns only a single string value; repeated query params are ignored. */
export function queryString(req: Request, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" ? value : undefined;
}

export function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  max: number,
  field: string,
): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  if (!/^\d+$/u.test(raw.trim())) {
    throw validationError(field, "Pozitif bir tam sayı gir.");
  }

  const value = Number(raw.trim());
  if (!Number.isSafeInteger(value) || value < 1 || value > max) {
    throw validationError(field, `Değer 1 ile ${max} arasında olmalı.`);
  }
  return value;
}

export function pathParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseResourceId(raw: string | undefined): number {
  if (raw === undefined || !/^\d+$/u.test(raw)) {
    throw validationError("id", "Geçerli bir kimlik gerekli.");
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw validationError("id", "Geçerli bir kimlik gerekli.");
  }
  return value;
}
