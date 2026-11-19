import { CLUB_CATEGORIES, POST_CATEGORIES } from "./constants";
import type { ClubCategory, PostCategory } from "./types";

const SINGLE_LINE_CONTROL_CHARS = /[\u0000-\u001f\u007f]+/gu;
const MULTILINE_CONTROL_CHARS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/gu;
const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

/** Collapses every whitespace run into one space and strips control chars. */
export function normalizeSingleLine(value: string): string {
  return value
    .replace(SINGLE_LINE_CONTROL_CHARS, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Keeps intentional line breaks but removes invisible control characters,
 * trailing spaces, and runs of more than one blank line.
 */
export function normalizeMultiline(value: string): string {
  return value
    .replace(/\r\n?/gu, "\n")
    .replace(MULTILINE_CONTROL_CHARS, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/gu, ""))
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

/** Produces an ASCII, URL-safe slug from Turkish or Latin input. */
export function slugify(value: string): string {
  const lower = value.toLocaleLowerCase("tr-TR");
  const mapped = Array.from(lower)
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "");

  return mapped
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 60)
    .replace(/-+$/gu, "");
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value);
}

export function isClubCategory(value: unknown): value is ClubCategory {
  return (
    typeof value === "string" &&
    (CLUB_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isPostCategory(value: unknown): value is PostCategory {
  return (
    typeof value === "string" &&
    (POST_CATEGORIES as readonly string[]).includes(value)
  );
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
