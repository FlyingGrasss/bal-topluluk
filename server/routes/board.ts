import { Router } from "express";
import {
  BOARD_PAGE_DEFAULT_LIMIT,
  BOARD_PAGE_MAX_INDEX,
  BOARD_PAGE_MAX_LIMIT,
  BOARD_RATE_LIMIT,
} from "../../shared/constants.js";
import type { PostCategory } from "../../shared/types.js";
import { isPostCategory } from "../../shared/validation.js";
import type { AppContext } from "../context.js";
import { validationError } from "../errors.js";
import {
  asyncHandler,
  clientIp,
  enforceRateLimit,
  parsePositiveInt,
  queryString,
} from "../http.js";
import { TokenBucketRateLimiter } from "../rate-limit.js";

export function createBoardRouter(ctx: AppContext): Router {
  const router = Router();
  const postLimiter = new TokenBucketRateLimiter(
    BOARD_RATE_LIMIT.limit,
    BOARD_RATE_LIMIT.windowMs,
  );

  router.get(
    "/",
    asyncHandler((req, res) => {
      const rawCategory = queryString(req, "category");
      let category: PostCategory | null = null;

      if (rawCategory !== undefined && rawCategory.trim() !== "") {
        if (!isPostCategory(rawCategory)) {
          throw validationError(
            "category",
            "Kategori duyuru, etkinlik, soru veya genel olmalı.",
          );
        }
        category = rawCategory;
      }

      const page = parsePositiveInt(
        queryString(req, "page"),
        1,
        BOARD_PAGE_MAX_INDEX,
        "page",
      );
      const limit = parsePositiveInt(
        queryString(req, "limit"),
        BOARD_PAGE_DEFAULT_LIMIT,
        BOARD_PAGE_MAX_LIMIT,
        "limit",
      );

      res.status(200).json(
        ctx.services.community.listBoard({ category, page, limit }),
      );
    }),
  );

  router.post(
    "/",
    asyncHandler((req, res) => {
      enforceRateLimit(postLimiter, clientIp(req), res);
      const post = ctx.services.community.createPost(req.body, {
        allowPinned: false,
      });
      res.status(201).json({ post });
    }),
  );

  return router;
}
