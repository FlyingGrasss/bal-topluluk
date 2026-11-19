import { Router, type Request, type Response } from "express";

export function healthHandler(_req: Request, res: Response): void {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true });
}

export function createMetaRouter(): Router {
  const router = Router();
  router.get("/health", healthHandler);
  return router;
}
