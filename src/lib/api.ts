import type {
  AdminSessionResponse,
  ApiErrorCode,
  BoardResponse,
  ClubResponse,
  CreateClubInput,
  CreateEventInput,
  CreatePostInput,
  EventResponse,
  EventsResponse,
  PostResponse,
  ClubsResponse,
} from "@shared/types";
export interface ApiErrorOptions {
  field?: string;
  retryAfterMs?: number;
}

/** Normalized error for every browser `/api` response. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly field?: string;
  readonly retryAfterMs?: number;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = options.field;
    this.retryAfterMs = options.retryAfterMs;
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

function fallbackCode(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL_ERROR";
  }
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 401:
      return "Yönetici anahtarı gerekli.";
    case 403:
      return "Bu işlem için yetkin yok.";
    case 404:
      return "Kaynak bulunamadı.";
    case 429:
      return "Çok fazla istek. Lütfen biraz sonra tekrar dene.";
    default:
      return "Bir şeyler ters gitti. Tekrar dene.";
  }
}

/** Parses the API's `{ error: { code, message, field?, retryAfterMs? } }` envelope. */
export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const envelope =
    typeof body === "object" && body !== null && "error" in body
      ? (body as { error?: unknown }).error
      : undefined;

  if (typeof envelope === "object" && envelope !== null) {
    const record = envelope as Record<string, unknown>;
    const message =
      typeof record.message === "string" && record.message.trim()
        ? record.message
        : fallbackMessage(status);
    const code =
      typeof record.code === "string"
        ? (record.code as ApiErrorCode)
        : fallbackCode(status);

    return new ApiError(status, code, message, {
      ...(typeof record.field === "string" ? { field: record.field } : {}),
      ...(typeof record.retryAfterMs === "number" &&
      Number.isFinite(record.retryAfterMs)
        ? { retryAfterMs: record.retryAfterMs }
        : {}),
    });
  }

  return new ApiError(status, fallbackCode(status), fallbackMessage(status));
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  adminToken?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(adminToken ? { "X-Admin-Token": adminToken } : {}),
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(
      0,
      "INTERNAL_ERROR",
      "Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw apiErrorFromBody(response.status, body);
  }

  return body as T;
}

function jsonBody(value: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  };
}

export async function submitPost(input: CreatePostInput): Promise<PostResponse> {
  return request<PostResponse>("/api/board", jsonBody(input));
}

export async function fetchClubList(): Promise<ClubsResponse> {
  return request<ClubsResponse>("/api/clubs");
}

export async function fetchBoard(limit = 50): Promise<BoardResponse> {
  return request<BoardResponse>(`/api/board?limit=${limit}`);
}

export async function fetchEvents(): Promise<EventsResponse> {
  return request<EventsResponse>("/api/events");
}

export async function validateAdminToken(
  token: string,
): Promise<AdminSessionResponse> {
  return request<AdminSessionResponse>("/api/admin/session", {}, token);
}

export async function createAdminPost(
  token: string,
  input: CreatePostInput & { pinned?: boolean },
): Promise<PostResponse> {
  return request<PostResponse>("/api/admin/posts", jsonBody(input), token);
}

export async function setPostPinned(
  token: string,
  id: number,
  pinned: boolean,
): Promise<PostResponse> {
  return request<PostResponse>(
    `/api/admin/posts/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    },
    token,
  );
}

export async function deleteAdminPost(
  token: string,
  id: number,
): Promise<void> {
  await request<void>(`/api/admin/posts/${id}`, { method: "DELETE" }, token);
}

export async function createAdminClub(
  token: string,
  input: CreateClubInput,
): Promise<ClubResponse> {
  return request<ClubResponse>("/api/admin/clubs", jsonBody(input), token);
}

export async function createAdminEvent(
  token: string,
  input: CreateEventInput,
): Promise<EventResponse> {
  return request<EventResponse>("/api/admin/events", jsonBody(input), token);
}

export async function deleteAdminEvent(
  token: string,
  id: number,
): Promise<void> {
  await request<void>(`/api/admin/events/${id}`, { method: "DELETE" }, token);
}
