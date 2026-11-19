import { Router } from "express";
import type { AppContext } from "../context.js";
import { notFound } from "../errors.js";
import { asyncHandler, pathParam } from "../http.js";

export function createClubsRouter(ctx: AppContext): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler((_req, res) => {
      res.status(200).json({ clubs: ctx.services.community.listClubs() });
    }),
  );

  router.get(
    "/:slug",
    asyncHandler((req, res) => {
      const detail = ctx.services.community.getClubDetail(
        pathParam(req, "slug"),
      );
      if (!detail) throw notFound("Topluluk bulunamadı.");
      res.status(200).json(detail);
    }),
  );

  return router;
}
