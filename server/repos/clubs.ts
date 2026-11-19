import type { ClubCategory, ClubDto } from "../../shared/types.js";
import type { AppDatabase } from "../db.js";

interface ClubRow {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  meeting_note: string;
  contact: string;
  created_at: number;
  post_count: number;
  upcoming_event_count: number;
}

export interface InsertClubInput {
  name: string;
  slug: string;
  description: string;
  category: ClubCategory;
  meetingNote: string;
  contact: string;
  createdAt: number;
}

const CLUB_SELECT = `
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.category,
    c.meeting_note,
    c.contact,
    c.created_at,
    (SELECT COUNT(*) FROM posts p WHERE p.club_id = c.id) AS post_count,
    (
      SELECT COUNT(*) FROM events e
      WHERE e.club_id = c.id AND e.starts_at >= ?
    ) AS upcoming_event_count
  FROM clubs c
`;

function mapClub(row: ClubRow): ClubDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category as ClubCategory,
    meetingNote: row.meeting_note,
    contact: row.contact,
    createdAt: row.created_at,
    postCount: row.post_count,
    upcomingEventCount: row.upcoming_event_count,
  };
}

export function listClubs(db: AppDatabase, now: number): ClubDto[] {
  const rows = db
    .prepare(
      `${CLUB_SELECT}
       ORDER BY c.name COLLATE NOCASE ASC, c.id ASC`,
    )
    .all(now) as ClubRow[];
  return rows.map(mapClub);
}

export function findClubBySlug(
  db: AppDatabase,
  slug: string,
  now: number,
): ClubDto | null {
  const row = db
    .prepare(`${CLUB_SELECT} WHERE c.slug = ?`)
    .get(now, slug) as ClubRow | undefined;
  return row ? mapClub(row) : null;
}

export function findClubById(
  db: AppDatabase,
  id: number,
  now: number,
): ClubDto | null {
  const row = db
    .prepare(`${CLUB_SELECT} WHERE c.id = ?`)
    .get(now, id) as ClubRow | undefined;
  return row ? mapClub(row) : null;
}

export function insertClub(
  db: AppDatabase,
  input: InsertClubInput,
): ClubDto {
  const result = db
    .prepare(
      `INSERT INTO clubs
         (name, slug, description, category, meeting_note, contact, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.name,
      input.slug,
      input.description,
      input.category,
      input.meetingNote,
      input.contact,
      input.createdAt,
    );

  const club = findClubById(db, Number(result.lastInsertRowid), input.createdAt);
  if (!club) throw new Error("Topluluk kaydı oluşturulamadı.");
  return club;
}

export function countClubs(db: AppDatabase): number {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM clubs")
    .get() as { count: number };
  return row.count;
}
