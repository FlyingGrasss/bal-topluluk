import { resolve } from "node:path";
import {
  ADMIN_TOKEN_MIN_LENGTH,
  API_DEFAULT_HOST,
  API_DEFAULT_PORT,
} from "../shared/constants.js";

export interface AppConfig {
  port: number;
  host: string;
  dbPath: string;
  isProduction: boolean;
  trustProxy: boolean;
  adminToken: string | null;
}

export function resolveConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProduction = env.NODE_ENV === "production";
  const adminToken = env.ADMIN_TOKEN?.trim() || null;

  if (adminToken !== null && adminToken.length < ADMIN_TOKEN_MIN_LENGTH) {
    throw new Error(
      `ADMIN_TOKEN en az ${ADMIN_TOKEN_MIN_LENGTH} karakter olmalı.`,
    );
  }
  if (isProduction && adminToken === null) {
    throw new Error("Üretimde ADMIN_TOKEN ortam değişkeni zorunlu.");
  }

  return {
    port: parsePort(env.API_PORT),
    host: env.API_HOST?.trim() || API_DEFAULT_HOST,
    dbPath: resolve(process.cwd(), env.DB_PATH?.trim() || "data/bal-topluluk.db"),
    isProduction,
    trustProxy: parseBoolean(env.TRUST_PROXY),
    adminToken,
  };
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return API_DEFAULT_PORT;

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`API_PORT 1 ile 65535 arasında bir tam sayı olmalı (verilen: ${raw}).`);
  }
  return port;
}

function parseBoolean(raw: string | undefined): boolean {
  if (!raw) return false;
  return ["1", "true", "yes", "on"].includes(raw.trim().toLowerCase());
}
