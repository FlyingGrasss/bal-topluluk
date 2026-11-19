import { Router } from "express";
import { ADMIN_RATE_LIMIT } from "../../shared/constants.js";
import { createAdminGuard } from "../auth.js";
import type { AppContext } from "../context.js";
import { asyncHandler, parseResourceId, pathParam } from "../http.js";
import { TokenBucketRateLimiter } from "../rate-limit.js";

export function createAdminRouter(ctx: AppContext): Router {
  const router = Router();
  const limiter = new TokenBucketRateLimiter(
    ADMIN_RATE_LIMIT.limit,
    ADMIN_RATE_LIMIT.windowMs,
  );
  router.use(createAdminGuard(ctx, limiter));

  router.get(
    "/session",
    asyncHandler((_req, res) => {
      res.status(200).json({ ok: true });
    }),
  );

  router.post(
    "/posts",
    asyncHandler((req, res) => {
      const post = ctx.services.community.createPost(req.body, {
        allowPinned: true,
      });
      res.status(201).json({ post });
    }),
  );

  router.patch(
    "/posts/:id",
    asyncHandler((req, res) => {
      const post = ctx.services.community.setPinned(
        parseResourceId(pathParam(req, "id")),
        req.body,
      );
      res.status(200).json({ post });
    }),
  );

  router.delete(
    "/posts/:id",
    asyncHandler((req, res) => {
      ctx.services.community.removePost(
        parseResourceId(pathParam(req, "id")),
      );
      res.status(204).end();
    }),
  );

  router.post(
    "/clubs",
    asyncHandler((req, res) => {
      const club = ctx.services.community.createClub(req.body);
      res.status(201).json({ club });
    }),
  );

  router.post(
    "/events",
    asyncHandler((req, res) => {
      const event = ctx.services.community.createEvent(req.body);
      res.status(201).json({ event });
    }),
  );

  router.delete(
    "/events/:id",
    asyncHandler((req, res) => {
      ctx.services.community.removeEvent(
        parseResourceId(pathParam(req, "id")),
      );
      res.status(204).end();
    }),
  );

  return router;
}
