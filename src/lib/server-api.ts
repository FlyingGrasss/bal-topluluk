import { API_DEFAULT_PORT } from "@shared/constants";
import type {
  BoardResponse,
  ClubDetailResponse,
  ClubDto,
  ClubsResponse,
  EventDto,
  EventsResponse,
  PostCategory,
} from "@shared/types";

const API_BASE = (
  process.env.API_URL?.trim() || `http://127.0.0.1:${API_DEFAULT_PORT}`
).replace(/\/+$/u, "");

const REQUEST_TIMEOUT_MS = 6_000;

export class ServerApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
  }
}

async function serverFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ServerApiError(
      0,
      "Topluluk servisine ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
    );
  }

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
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: { message?: unknown } }).error?.message ===
        "string"
        ? (body as { error: { message: string } }).error.message
        : "Topluluk servisi isteği tamamlayamadı.";
    throw new ServerApiError(response.status, message);
  }

  return body as T;
}

export async function getClubs(): Promise<ClubDto[]> {
  const response = await serverFetch<ClubsResponse>("/api/clubs");
  return response.clubs;
}

export async function getClubDetail(
  slug: string,
): Promise<ClubDetailResponse | null> {
  try {
    return await serverFetch<ClubDetailResponse>(
      `/api/clubs/${encodeURIComponent(slug)}`,
    );
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getBoard(options: {
  category?: PostCategory;
  page?: number;
  limit?: number;
} = {}): Promise<BoardResponse> {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.page !== undefined) params.set("page", String(options.page));
  if (options.limit !== undefined) params.set("limit", String(options.limit));

  const query = params.toString();
  return serverFetch<BoardResponse>(`/api/board${query ? `?${query}` : ""}`);
}

export async function getEvents(): Promise<EventDto[]> {
  const response = await serverFetch<EventsResponse>("/api/events");
  return response.events;
}
