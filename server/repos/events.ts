import type { EventDto } from "../../shared/types.js";
import type { AppDatabase } from "../db.js";

interface EventRow {
  id: number;
  club_id: number;
  club_name: string;
  club_slug: string;
  title: string;
  description: string;
  starts_at: number;
  location: string;
  created_at: number;
}

export interface InsertEventInput {
  clubId: number;
  title: string;
  description: string;
  startsAt: number;
  location: string;
  createdAt: number;
}

const EVENT_SELECT = `
  SELECT
    e.id,
    e.club_id,
    c.name AS club_name,
    c.slug AS club_slug,
    e.title,
    e.description,
    e.starts_at,
    e.location,
    e.created_at
  FROM events e
  INNER JOIN clubs c ON c.id = e.club_id
`;

function mapEvent(row: EventRow): EventDto {
  return {
    id: row.id,
    clubId: row.club_id,
    clubName: row.club_name,
    clubSlug: row.club_slug,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    location: row.location,
    createdAt: row.created_at,
  };
}

export function listUpcomingEvents(
  db: AppDatabase,
  now: number,
  limit: number,
): EventDto[] {
  const rows = db
    .prepare(
      `${EVENT_SELECT}
       WHERE e.starts_at >= ?
       ORDER BY e.starts_at ASC, e.id ASC
       LIMIT ?`,
    )
    .all(now, limit) as EventRow[];
  return rows.map(mapEvent);
}

export function listClubUpcomingEvents(
  db: AppDatabase,
  clubId: number,
  now: number,
  limit: number,
): EventDto[] {
  const rows = db
    .prepare(
      `${EVENT_SELECT}
       WHERE e.club_id = ? AND e.starts_at >= ?
       ORDER BY e.starts_at ASC, e.id ASC
       LIMIT ?`,
    )
    .all(clubId, now, limit) as EventRow[];
  return rows.map(mapEvent);
}

export function findEventById(
  db: AppDatabase,
  id: number,
): EventDto | null {
  const row = db
    .prepare(`${EVENT_SELECT} WHERE e.id = ?`)
    .get(id) as EventRow | undefined;
  return row ? mapEvent(row) : null;
}

export function insertEvent(
  db: AppDatabase,
  input: InsertEventInput,
): EventDto {
  const result = db
    .prepare(
      `INSERT INTO events
         (club_id, title, description, starts_at, location, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.clubId,
      input.title,
      input.description,
      input.startsAt,
      input.location,
      input.createdAt,
    );

  const event = findEventById(db, Number(result.lastInsertRowid));
  if (!event) throw new Error("Etkinlik kaydı oluşturulamadı.");
  return event;
}

export function deleteEvent(db: AppDatabase, id: number): boolean {
  const result = db.prepare("DELETE FROM events WHERE id = ?").run(id);
  return result.changes > 0;
}

export function countUpcomingEvents(
  db: AppDatabase,
  now: number,
): number {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM events WHERE starts_at >= ?")
    .get(now) as { count: number };
  return row.count;
}
