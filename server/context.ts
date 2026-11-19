import { resolve } from "node:path";
import type { AppConfig } from "./config.js";
import { resolveConfig } from "./config.js";
import type { AppDatabase } from "./db.js";
import { openDatabase } from "./db.js";
import { CommunityService } from "./services/community.js";

export interface AppContext {
  config: AppConfig;
  db: AppDatabase;
  services: {
    community: CommunityService;
  };
  close(): void;
}

export interface CreateContextOptions {
  env?: NodeJS.ProcessEnv;
  config?: AppConfig;
  dbPath?: string;
  schemaPath?: string;
  adminToken?: string | null;
}

export function createContext(options: CreateContextOptions = {}): AppContext {
  const base = options.config ?? resolveConfig(options.env);
  const config: AppConfig = {
    ...base,
    ...(options.dbPath ? { dbPath: resolve(options.dbPath) } : {}),
    ...(options.adminToken !== undefined
      ? { adminToken: options.adminToken }
      : {}),
  };

  const db = openDatabase(config.dbPath, options.schemaPath);
  const community = new CommunityService(db);

  let closed = false;

  return {
    config,
    db,
    services: { community },
    close() {
      if (closed) return;
      closed = true;
      db.close();
    },
  };
}
