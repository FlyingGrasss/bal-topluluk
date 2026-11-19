import {
  AUTHOR_NAME_MAX_LENGTH,
  AUTHOR_NAME_MIN_LENGTH,
  CLUB_CONTACT_MAX_LENGTH,
  CLUB_DESCRIPTION_MAX_LENGTH,
  CLUB_DESCRIPTION_MIN_LENGTH,
  CLUB_MEETING_NOTE_MAX_LENGTH,
  CLUB_NAME_MAX_LENGTH,
  CLUB_NAME_MIN_LENGTH,
  CLUB_SLUG_MAX_LENGTH,
  CLUB_SLUG_MIN_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_DESCRIPTION_MIN_LENGTH,
  EVENT_LOCATION_MAX_LENGTH,
  EVENT_LOCATION_MIN_LENGTH,
  EVENT_TITLE_MAX_LENGTH,
  EVENT_TITLE_MIN_LENGTH,
  POST_BODY_MAX_LENGTH,
  POST_BODY_MIN_LENGTH,
  POST_TITLE_MAX_LENGTH,
  POST_TITLE_MIN_LENGTH,
} from "../../shared/constants.js";
import type {
  BoardResponse,
  ClubDetailResponse,
  ClubDto,
  EventDto,
  PostCategory,
  PostDto,
} from "../../shared/types.js";
import {
  asRecord,
  isClubCategory,
  isPostCategory,
  isValidSlug,
  normalizeMultiline,
  normalizeSingleLine,
  slugify,
} from "../../shared/validation.js";
import type { AppDatabase } from "../db.js";
import { ApiError, conflict, notFound, validationError } from "../errors.js";
import {
  type InsertClubInput,
  findClubBySlug,
  insertClub,
  listClubs,
} from "../repos/clubs.js";
import {
  type InsertPostInput,
  deletePost,
  insertPost,
  listBoardPosts,
  listClubPosts,
  setPostPinned,
  countBoardPosts,
} from "../repos/posts.js";
import {
  type InsertEventInput,
  deleteEvent,
  insertEvent,
  listClubUpcomingEvents,
  listUpcomingEvents,
} from "../repos/events.js";

const CLUB_POSTS_LIMIT = 30;
const CLUB_EVENTS_LIMIT = 10;
const EVENTS_LIMIT = 100;
const FIVE_MINUTES = 5 * 60 * 1000;
const FIVE_YEARS = 5 * 365 * 24 * 60 * 60 * 1000;

function charLength(value: string): number {
  return Array.from(value).length;
}

function requiredText(
  record: Record<string, unknown>,
  field: string,
  label: string,
  min: number,
  max: number,
): string {
  const raw = record[field];
  if (typeof raw !== "string") {
    throw validationError(field, `${label} gerekli.`);
  }

  const value = normalizeSingleLine(raw);
  if (charLength(value) < min) {
    throw validationError(field, `${label} en az ${min} karakter olmalı.`);
  }
  if (charLength(value) > max) {
    throw validationError(field, `${label} en fazla ${max} karakter olabilir.`);
  }
  return value;
}

function optionalText(
  record: Record<string, unknown>,
  field: string,
  label: string,
  max: number,
): string {
  const raw = record[field];
  if (raw === undefined || raw === null || raw === "") return "";
  if (typeof raw !== "string") {
    throw validationError(field, `${label} metin olmalı.`);
  }

  const value = normalizeSingleLine(raw);
  if (charLength(value) > max) {
    throw validationError(field, `${label} en fazla ${max} karakter olabilir.`);
  }
  return value;
}

function requiredMultiline(
  record: Record<string, unknown>,
  field: string,
  label: string,
  min: number,
  max: number,
): string {
  const raw = record[field];
  if (typeof raw !== "string") {
    throw validationError(field, `${label} gerekli.`);
  }

  const value = normalizeMultiline(raw);
  if (charLength(value) < min) {
    throw validationError(field, `${label} en az ${min} karakter olmalı.`);
  }
  if (charLength(value) > max) {
    throw validationError(field, `${label} en fazla ${max} karakter olabilir.`);
  }
  return value;
}

function readPostCategory(record: Record<string, unknown>): PostCategory {
  const raw = record.category;
  if (!isPostCategory(raw)) {
    throw validationError("category", "Geçerli bir kategori seç.");
  }
  return raw;
}

export class CommunityService {
  constructor(private readonly db: AppDatabase) {}

  listClubs(now: number = Date.now()): ClubDto[] {
    return listClubs(this.db, now);
  }

  getClubDetail(
    slug: string,
    now: number = Date.now(),
  ): ClubDetailResponse | null {
    const club = findClubBySlug(this.db, slug, now);
    if (!club) return null;

    return {
      club,
      posts: listClubPosts(this.db, club.id, CLUB_POSTS_LIMIT),
      events: listClubUpcomingEvents(this.db, club.id, now, CLUB_EVENTS_LIMIT),
    };
  }

  listBoard(options: {
    category: PostCategory | null;
    page: number;
    limit: number;
  }): BoardResponse {
    const offset = (options.page - 1) * options.limit;
    const posts = listBoardPosts(this.db, {
      category: options.category,
      limit: options.limit,
      offset,
    });
    const total = countBoardPosts(this.db, options.category);

    return {
      posts,
      page: options.page,
      limit: options.limit,
      total,
      hasMore: offset + posts.length < total,
    };
  }

  listEvents(now: number = Date.now()): EventDto[] {
    return listUpcomingEvents(this.db, now, EVENTS_LIMIT);
  }

  createPost(body: unknown, options: { allowPinned: boolean }): PostDto {
    const record = asRecord(body);

    if (typeof record.website === "string" && record.website.trim() !== "") {
      throw validationError("website", "Form doğrulanamadı.");
    }

    const authorName = requiredText(
      record,
      "authorName",
      "Ad",
      AUTHOR_NAME_MIN_LENGTH,
      AUTHOR_NAME_MAX_LENGTH,
    );
    const title = requiredText(
      record,
      "title",
      "Başlık",
      POST_TITLE_MIN_LENGTH,
      POST_TITLE_MAX_LENGTH,
    );
    const bodyText = requiredMultiline(
      record,
      "body",
      "Mesaj",
      POST_BODY_MIN_LENGTH,
      POST_BODY_MAX_LENGTH,
    );
    const category = readPostCategory(record);

    const clubSlug = this.readOptionalClubSlug(record);
    const now = Date.now();
    const club = clubSlug ? findClubBySlug(this.db, clubSlug, now) : null;
    if (clubSlug && !club) {
      throw validationError("clubSlug", "Seçilen topluluk bulunamadı.");
    }

    let pinned = false;
    if (options.allowPinned && record.pinned !== undefined) {
      if (typeof record.pinned !== "boolean") {
        throw validationError("pinned", "Sabitleme değeri doğru değil.");
      }
      pinned = record.pinned;
    }

    const input: InsertPostInput = {
      clubId: club?.id ?? null,
      authorName,
      title,
      body: bodyText,
      category,
      pinned,
      createdAt: now,
    };
    return insertPost(this.db, input);
  }

  setPinned(id: number, body: unknown): PostDto {
    const record = asRecord(body);
    if (typeof record.pinned !== "boolean") {
      throw validationError("pinned", "Sabitleme değeri doğru değil.");
    }

    const post = setPostPinned(this.db, id, record.pinned);
    if (!post) throw notFound("Gönderi bulunamadı.");
    return post;
  }

  removePost(id: number): void {
    if (!deletePost(this.db, id)) {
      throw notFound("Gönderi bulunamadı.");
    }
  }

  createClub(body: unknown): ClubDto {
    const record = asRecord(body);
    const name = requiredText(
      record,
      "name",
      "Topluluk adı",
      CLUB_NAME_MIN_LENGTH,
      CLUB_NAME_MAX_LENGTH,
    );

    const rawSlug = record.slug;
    let slug = "";
    if (typeof rawSlug === "string" && rawSlug.trim() !== "") {
      slug = normalizeSingleLine(rawSlug).toLowerCase();
      if (!isValidSlug(slug) || charLength(slug) < CLUB_SLUG_MIN_LENGTH) {
        throw validationError(
          "slug",
          "Adres yalnızca küçük harf, sayı ve tire içerebilir.",
        );
      }
      if (charLength(slug) > CLUB_SLUG_MAX_LENGTH) {
        throw validationError(
          "slug",
          `Adres en fazla ${CLUB_SLUG_MAX_LENGTH} karakter olabilir.`,
        );
      }
    } else {
      slug = slugify(name);
      if (charLength(slug) < CLUB_SLUG_MIN_LENGTH) {
        throw validationError("slug", "Topluluk için geçerli bir adres üretilemedi.");
      }
    }

    const description = requiredMultiline(
      record,
      "description",
      "Açıklama",
      CLUB_DESCRIPTION_MIN_LENGTH,
      CLUB_DESCRIPTION_MAX_LENGTH,
    );
    const category = record.category;
    if (!isClubCategory(category)) {
      throw validationError("category", "Geçerli bir kategori seç.");
    }

    const meetingNote = optionalText(
      record,
      "meetingNote",
      "Buluşma notu",
      CLUB_MEETING_NOTE_MAX_LENGTH,
    );
    const contact = optionalText(
      record,
      "contact",
      "İletişim",
      CLUB_CONTACT_MAX_LENGTH,
    );

    const input: InsertClubInput = {
      name,
      slug,
      description,
      category,
      meetingNote,
      contact,
      createdAt: Date.now(),
    };

    try {
      return insertClub(this.db, input);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (isUniqueConstraint(error)) {
        throw conflict("Bu adresle bir topluluk zaten var.");
      }
      throw error;
    }
  }

  createEvent(body: unknown): EventDto {
    const record = asRecord(body);
    const clubSlug = this.readOptionalClubSlug(record);
    if (!clubSlug) {
      throw validationError("clubSlug", "Topluluk seç.");
    }

    const now = Date.now();
    const club = findClubBySlug(this.db, clubSlug, now);
    if (!club) {
      throw validationError("clubSlug", "Seçilen topluluk bulunamadı.");
    }

    const title = requiredText(
      record,
      "title",
      "Etkinlik adı",
      EVENT_TITLE_MIN_LENGTH,
      EVENT_TITLE_MAX_LENGTH,
    );
    const description = requiredMultiline(
      record,
      "description",
      "Açıklama",
      EVENT_DESCRIPTION_MIN_LENGTH,
      EVENT_DESCRIPTION_MAX_LENGTH,
    );
    const location = requiredText(
      record,
      "location",
      "Yer",
      EVENT_LOCATION_MIN_LENGTH,
      EVENT_LOCATION_MAX_LENGTH,
    );

    const startsAt = readStartsAt(record.startsAt, now);
    const input: InsertEventInput = {
      clubId: club.id,
      title,
      description,
      startsAt,
      location,
      createdAt: now,
    };
    return insertEvent(this.db, input);
  }

  removeEvent(id: number): void {
    if (!deleteEvent(this.db, id)) {
      throw notFound("Etkinlik bulunamadı.");
    }
  }

  private readOptionalClubSlug(
    record: Record<string, unknown>,
  ): string | null {
    const raw = record.clubSlug;
    if (raw === undefined || raw === null || raw === "") return null;
    if (typeof raw !== "string") {
      throw validationError("clubSlug", "Topluluk seçimi metin olmalı.");
    }

    const slug = normalizeSingleLine(raw);
    if (!isValidSlug(slug)) {
      throw validationError("clubSlug", "Topluluk seçimi geçersiz.");
    }
    return slug;
  }
}

function readStartsAt(raw: unknown, now: number): number {
  let value: number | null = null;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    value = raw;
  } else if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) value = parsed;
  }

  if (value === null) {
    throw validationError("startsAt", "Geçerli bir başlangıç zamanı gir.");
  }
  if (value < now - FIVE_MINUTES) {
    throw validationError("startsAt", "Başlangıç zamanı geçmişte olamaz.");
  }
  if (value > now + FIVE_YEARS) {
    throw validationError("startsAt", "Başlangıç zamanı çok uzakta.");
  }
  return value;
}

function isUniqueConstraint(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
