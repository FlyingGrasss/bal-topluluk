/** Shared, framework-free limits and stable identifiers. */

import type { ClubCategory, PostCategory } from "./types";

export const API_DEFAULT_PORT = 4600;
export const API_DEFAULT_HOST = "127.0.0.1";

export const MAX_BODY_BYTES = 64 * 1024;

export const BOARD_PAGE_DEFAULT_LIMIT = 50;
export const BOARD_PAGE_MAX_LIMIT = 50;
export const BOARD_PAGE_MAX_INDEX = 100_000;
export const BOARD_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 } as const;
export const ADMIN_RATE_LIMIT = {
  limit: 60,
  windowMs: 10 * 60 * 1000,
} as const;

export const ADMIN_HEADER_NAME = "x-admin-token";
export const ADMIN_TOKEN_MIN_LENGTH = 16;

export const AUTHOR_NAME_MIN_LENGTH = 2;
export const AUTHOR_NAME_MAX_LENGTH = 40;
export const POST_TITLE_MIN_LENGTH = 3;
export const POST_TITLE_MAX_LENGTH = 120;
export const POST_BODY_MIN_LENGTH = 10;
export const POST_BODY_MAX_LENGTH = 4000;

export const CLUB_NAME_MIN_LENGTH = 2;
export const CLUB_NAME_MAX_LENGTH = 60;
export const CLUB_SLUG_MIN_LENGTH = 2;
export const CLUB_SLUG_MAX_LENGTH = 60;
export const CLUB_DESCRIPTION_MIN_LENGTH = 10;
export const CLUB_DESCRIPTION_MAX_LENGTH = 1200;
export const CLUB_MEETING_NOTE_MAX_LENGTH = 200;
export const CLUB_CONTACT_MAX_LENGTH = 120;

export const EVENT_TITLE_MIN_LENGTH = 3;
export const EVENT_TITLE_MAX_LENGTH = 120;
export const EVENT_DESCRIPTION_MIN_LENGTH = 10;
export const EVENT_DESCRIPTION_MAX_LENGTH = 800;
export const EVENT_LOCATION_MIN_LENGTH = 2;
export const EVENT_LOCATION_MAX_LENGTH = 120;

export const POST_CATEGORIES = [
  "duyuru",
  "etkinlik",
  "soru",
  "genel",
] as const satisfies readonly PostCategory[];

export const CLUB_CATEGORIES = [
  "müzik",
  "spor",
  "bilim",
  "sanat",
  "girişim",
  "diğer",
] as const satisfies readonly ClubCategory[];
