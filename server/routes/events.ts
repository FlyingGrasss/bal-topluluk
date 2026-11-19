import { Router } from "express";
import type { AppContext } from "../context.js";
import { asyncHandler } from "../http.js";

export function createEventsRouter(ctx: AppContext): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler((_req, res) => {
      res.status(200).json({ events: ctx.services.community.listEvents() });
    }),
  );

  return router;
}
