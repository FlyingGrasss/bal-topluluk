/** Wire contracts shared by the Next app and the Express API. */

export type ClubCategory =
  | "müzik"
  | "spor"
  | "bilim"
  | "sanat"
  | "girişim"
  | "diğer";

export type PostCategory = "duyuru" | "etkinlik" | "soru" | "genel";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CLUB_EXISTS"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_JSON"
  | "ADMIN_NOT_CONFIGURED"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    field?: string;
    retryAfterMs?: number;
  };
}

export interface ClubDto {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: ClubCategory;
  meetingNote: string;
  contact: string;
  createdAt: number;
  postCount: number;
  upcomingEventCount: number;
}

export interface PostDto {
  id: number;
  clubId: number | null;
  clubName: string | null;
  clubSlug: string | null;
  authorName: string;
  title: string;
  body: string;
  category: PostCategory;
  pinned: boolean;
  createdAt: number;
}

export interface EventDto {
  id: number;
  clubId: number;
  clubName: string;
  clubSlug: string;
  title: string;
  description: string;
  startsAt: number;
  location: string;
  createdAt: number;
}

export interface ClubsResponse {
  clubs: ClubDto[];
}

export interface ClubDetailResponse {
  club: ClubDto;
  posts: PostDto[];
  events: EventDto[];
}

export interface BoardResponse {
  posts: PostDto[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PostResponse {
  post: PostDto;
}

export interface ClubResponse {
  club: ClubDto;
}

export interface EventsResponse {
  events: EventDto[];
}

export interface EventResponse {
  event: EventDto;
}

export interface AdminSessionResponse {
  ok: true;
}

export interface CreatePostInput {
  authorName: string;
  title: string;
  body: string;
  category: PostCategory;
  clubSlug?: string | null;
  website?: string;
}

export interface CreateClubInput {
  name: string;
  slug?: string;
  description: string;
  category: ClubCategory;
  meetingNote?: string;
  contact?: string;
}

export interface CreateEventInput {
  clubSlug: string;
  title: string;
  description: string;
  startsAt: number;
  location: string;
}
