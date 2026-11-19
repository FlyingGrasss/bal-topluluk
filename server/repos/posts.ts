import type { PostCategory, PostDto } from "../../shared/types.js";
import type { AppDatabase } from "../db.js";

interface PostRow {
  id: number;
  club_id: number | null;
  club_name: string | null;
  club_slug: string | null;
  author_name: string;
  title: string;
  body: string;
  category: string;
  pinned: number;
  created_at: number;
}

export interface InsertPostInput {
  clubId: number | null;
  authorName: string;
  title: string;
  body: string;
  category: PostCategory;
  pinned: boolean;
  createdAt: number;
}

export interface BoardQuery {
  category: PostCategory | null;
  limit: number;
  offset: number;
}

const POST_SELECT = `
  SELECT
    p.id,
    p.club_id,
    c.name AS club_name,
    c.slug AS club_slug,
    p.author_name,
    p.title,
    p.body,
    p.category,
    p.pinned,
    p.created_at
  FROM posts p
  LEFT JOIN clubs c ON c.id = p.club_id
`;

function mapPost(row: PostRow): PostDto {
  return {
    id: row.id,
    clubId: row.club_id,
    clubName: row.club_name,
    clubSlug: row.club_slug,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    category: row.category as PostCategory,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
  };
}

export function listBoardPosts(
  db: AppDatabase,
  query: BoardQuery,
): PostDto[] {
  const rows =
    query.category === null
      ? (db
          .prepare(
            `${POST_SELECT}
             ORDER BY p.pinned DESC, p.created_at DESC, p.id DESC
             LIMIT ? OFFSET ?`,
          )
          .all(query.limit, query.offset) as PostRow[])
      : (db
          .prepare(
            `${POST_SELECT}
             WHERE p.category = ?
             ORDER BY p.pinned DESC, p.created_at DESC, p.id DESC
             LIMIT ? OFFSET ?`,
          )
          .all(query.category, query.limit, query.offset) as PostRow[]);
  return rows.map(mapPost);
}

export function countBoardPosts(
  db: AppDatabase,
  category: PostCategory | null,
): number {
  const row =
    category === null
      ? (db
          .prepare("SELECT COUNT(*) AS count FROM posts")
          .get() as { count: number })
      : (db
          .prepare("SELECT COUNT(*) AS count FROM posts WHERE category = ?")
          .get(category) as { count: number });
  return row.count;
}

export function listClubPosts(
  db: AppDatabase,
  clubId: number,
  limit: number,
): PostDto[] {
  const rows = db
    .prepare(
      `${POST_SELECT}
       WHERE p.club_id = ?
       ORDER BY p.pinned DESC, p.created_at DESC, p.id DESC
       LIMIT ?`,
    )
    .all(clubId, limit) as PostRow[];
  return rows.map(mapPost);
}

export function findPostById(db: AppDatabase, id: number): PostDto | null {
  const row = db
    .prepare(`${POST_SELECT} WHERE p.id = ?`)
    .get(id) as PostRow | undefined;
  return row ? mapPost(row) : null;
}

export function insertPost(db: AppDatabase, input: InsertPostInput): PostDto {
  const result = db
    .prepare(
      `INSERT INTO posts
         (club_id, author_name, title, body, category, pinned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.clubId,
      input.authorName,
      input.title,
      input.body,
      input.category,
      input.pinned ? 1 : 0,
      input.createdAt,
    );

  const post = findPostById(db, Number(result.lastInsertRowid));
  if (!post) throw new Error("Gönderi kaydı oluşturulamadı.");
  return post;
}

export function setPostPinned(
  db: AppDatabase,
  id: number,
  pinned: boolean,
): PostDto | null {
  if (!findPostById(db, id)) return null;
  db.prepare("UPDATE posts SET pinned = ? WHERE id = ?").run(
    pinned ? 1 : 0,
    id,
  );
  return findPostById(db, id);
}

export function deletePost(db: AppDatabase, id: number): boolean {
  const result = db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  return result.changes > 0;
}

export function countPosts(db: AppDatabase): number {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM posts")
    .get() as { count: number };
  return row.count;
}

export function countPinnedPosts(db: AppDatabase): number {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM posts WHERE pinned = 1")
    .get() as { count: number };
  return row.count;
}
