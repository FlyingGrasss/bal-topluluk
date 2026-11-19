import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  BoardResponse,
  ClubDetailResponse,
  ClubResponse,
  ClubsResponse,
  EventResponse,
  EventsResponse,
  PostResponse,
} from "../shared/types.js";
import { createContext, type AppContext } from "./context.js";
import type { AppConfig } from "./config.js";
import { resolveConfig } from "./config.js";
import { seedDatabase } from "./seed.js";
import { startServer, type RunningServer } from "./index.js";

const TEST_ADMIN_TOKEN = "smoke-admin-token-1234567890";
const PUBLIC_IP = "198.51.100.10";
const VALIDATION_IP = "198.51.100.11";
const HTML_IP = "198.51.100.12";
const LIMIT_IP = "198.51.100.20";
const ADMIN_IP = "198.51.100.30";

interface ApiResult {
  status: number;
  data: unknown;
  headers: Headers;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  rawBody?: string;
  ip?: string;
  adminToken?: string | null;
  contentType?: string;
}

function ensure(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
  console.log(`  ✓ ${message}`);
}

function errorCode(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const error = (data as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return "";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "";
}

function errorField(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const error = (data as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return "";
  const field = (error as { field?: unknown }).field;
  return typeof field === "string" ? field : "";
}

async function main(): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), "bal-topluluk-smoke-"));
  let ctx: AppContext | undefined;
  let running: RunningServer | undefined;

  try {
    const baseConfig = resolveConfig({
      NODE_ENV: "test",
      DB_PATH: join(tempDir, "bal-topluluk.db"),
    });
    const config: AppConfig = {
      ...baseConfig,
      adminToken: TEST_ADMIN_TOKEN,
      trustProxy: true,
      isProduction: false,
    };

    ctx = createContext({ config });
    seedDatabase(ctx.db);

    running = await startServer({ context: ctx, port: 0, host: "127.0.0.1" });
    const baseUrl = `http://127.0.0.1:${running.port}`;

    async function api(path: string, options: ApiOptions = {}): Promise<ApiResult> {
      const method = options.method ?? "GET";
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (options.ip) headers["x-forwarded-for"] = options.ip;
      if (method !== "GET" && method !== "HEAD") {
        headers["content-type"] = options.contentType ?? "application/json";
      } else if (options.contentType) {
        headers["content-type"] = options.contentType;
      }
      if (options.adminToken) {
        headers["x-admin-token"] = options.adminToken;
      }

      const body =
        options.rawBody ??
        (options.body !== undefined ? JSON.stringify(options.body) : undefined);

      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body,
      });
      const text = await response.text();

      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      return { status: response.status, data, headers: response.headers };
    }

    console.log("BAL Topluluk API smoke testi\n");

    const userVersion = ctx.db.pragma("user_version", { simple: true });
    const journalMode = ctx.db.pragma("journal_mode", { simple: true });
    const foreignKeys = ctx.db.pragma("foreign_keys", { simple: true });
    const busyTimeout = ctx.db.pragma("busy_timeout", { simple: true });
    ensure(userVersion === 1, "user_version 1");
    ensure(String(journalMode).toLowerCase() === "wal", "journal_mode WAL");
    ensure(foreignKeys === 1, "foreign_keys açık");
    ensure(busyTimeout === 5000, "busy_timeout 5000");

    const seedCounts = {
      clubs: (
        ctx.db.prepare("SELECT COUNT(*) AS count FROM clubs").get() as {
          count: number;
        }
      ).count,
      posts: (
        ctx.db.prepare("SELECT COUNT(*) AS count FROM posts").get() as {
          count: number;
        }
      ).count,
      pinned: (
        ctx.db
          .prepare("SELECT COUNT(*) AS count FROM posts WHERE pinned = 1")
          .get() as { count: number }
      ).count,
    };
    ensure(seedCounts.clubs === 6, "seed 6 topluluk");
    ensure(seedCounts.posts === 8, "seed 8 gönderi");
    ensure(seedCounts.pinned === 2, "seed 2 sabit gönderi");

    const health = await api("/api/health");
    ensure(health.status === 200, "GET /api/health 200");

    const clubsResponse = await api("/api/clubs");
    ensure(clubsResponse.status === 200, "GET /api/clubs 200");
    const clubs = clubsResponse.data as ClubsResponse;
    ensure(clubs.clubs.length === 6, "topluluk listesi 6 kayıt");
    const chess = clubs.clubs.find((club) => club.slug === "satranc");
    ensure(chess !== undefined, "satranç topluluğu listelendi");
    ensure((chess?.postCount ?? 0) > 0, "topluluk gönderi sayısı dolu");
    ensure(
      (chess?.upcomingEventCount ?? 0) > 0,
      "topluluk yaklaşan etkinlik sayısı dolu",
    );

    const clubDetail = await api("/api/clubs/satranc");
    ensure(clubDetail.status === 200, "GET /api/clubs/satranc 200");
    const detail = clubDetail.data as ClubDetailResponse;
    ensure(detail.club.name === "Satranç Kulübü", "topluluk detayı doğru kulüp");
    ensure(detail.posts.length > 0, "topluluk detayında gönderiler var");
    ensure(detail.events.length > 0, "topluluk detayında etkinlikler var");

    const missingClub = await api("/api/clubs/yok");
    ensure(missingClub.status === 404, "bilinmeyen topluluk 404");
    ensure(errorCode(missingClub.data) === "NOT_FOUND", "404 kodu NOT_FOUND");

    const boardPage = await api("/api/board?limit=3&page=1");
    ensure(boardPage.status === 200, "GET /api/board 200");
    const firstPage = boardPage.data as BoardResponse;
    ensure(firstPage.posts.length === 3, "limit=3 üç gönderi");
    ensure(firstPage.total === 8, "pano toplamı 8");
    ensure(firstPage.hasMore === true, "ilk sayfada hasMore=true");
    ensure(
      firstPage.posts[0]?.pinned === true && firstPage.posts[1]?.pinned === true,
      "sabit gönderiler önce geliyor",
    );

    const secondPage = await api("/api/board?limit=3&page=2");
    const pageTwo = secondPage.data as BoardResponse;
    ensure(secondPage.status === 200, "ikinci sayfa 200");
    ensure(pageTwo.posts.length === 3, "ikinci sayfa üç gönderi");
    ensure(
      pageTwo.posts.every(
        (post) => !firstPage.posts.some((first) => first.id === post.id),
      ),
      "sayfalar çakışmıyor",
    );

    const invalidCategory = await api("/api/board?category=yok");
    ensure(invalidCategory.status === 400, "geçersiz kategori 400");
    ensure(
      errorCode(invalidCategory.data) === "VALIDATION_ERROR",
      "kategori hatası VALIDATION_ERROR",
    );

    const categoryFilter = await api("/api/board?category=soru");
    const filtered = categoryFilter.data as BoardResponse;
    ensure(categoryFilter.status === 200, "kategori filtresi 200");
    ensure(
      filtered.posts.length > 0 && filtered.posts.every((p) => p.category === "soru"),
      "kategori filtresi yalnızca soruları getirdi",
    );

    const eventsResponse = await api("/api/events");
    ensure(eventsResponse.status === 200, "GET /api/events 200");
    const upcoming = eventsResponse.data as EventsResponse;
    const now = Date.now();
    ensure(upcoming.events.length >= 3, "en az üç yaklaşan etkinlik");
    ensure(
      upcoming.events.every((event) => event.startsAt >= now - 1_000),
      "etkinlikler gelecekte",
    );
    ensure(
      upcoming.events.every(
        (event, index) =>
          index === 0 ||
          event.startsAt >= (upcoming.events[index - 1]?.startsAt ?? 0),
      ),
      "etkinlikler başlangıç zamanına göre sıralı",
    );

    const unauthPin = await api("/api/admin/posts/1", {
      method: "PATCH",
      ip: "198.51.100.31",
      body: { pinned: true },
    });
    ensure(unauthPin.status === 401, "token yoksa pin isteği 401");
    ensure(errorCode(unauthPin.data) === "UNAUTHORIZED", "401 kodu UNAUTHORIZED");

    const wrongToken = await api("/api/admin/posts/1", {
      method: "PATCH",
      ip: "198.51.100.31",
      adminToken: "yanlis-token-1234567890",
      body: { pinned: true },
    });
    ensure(wrongToken.status === 401, "yanlış token 401");

    const adminSession = await api("/api/admin/session", {
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
    });
    ensure(adminSession.status === 200, "doğru token ile oturum 200");

    const createdPost = await api("/api/board", {
      method: "POST",
      ip: PUBLIC_IP,
      body: {
        authorName: "Smoke Kullanıcısı",
        title: "Smoke testi gönderisi",
        body: "Bu gönderi uçtan uca test tarafından oluşturuldu.",
        category: "genel",
        clubSlug: "satranc",
      },
    });
    ensure(createdPost.status === 201, "geçerli gönderi 201");
    const created = (createdPost.data as PostResponse).post;
    ensure(created.pinned === false, "herkese açık gönderi sabitlenemez");
    ensure(created.clubSlug === "satranc", "gönderi kulübe bağlandı");
    ensure(typeof created.id === "number" && created.id > 0, "gönderi kimliği döndü");

    const shortAuthor = await api("/api/board", {
      method: "POST",
      ip: VALIDATION_IP,
      body: {
        authorName: "A",
        title: "Geçerli başlık",
        body: "Yeterince uzun bir gönderi gövdesi.",
        category: "genel",
      },
    });
    ensure(shortAuthor.status === 400, "kısa ad 400");
    ensure(errorField(shortAuthor.data) === "authorName", "hata alanı authorName");

    const honeypot = await api("/api/board", {
      method: "POST",
      ip: VALIDATION_IP,
      body: {
        authorName: "Bot",
        title: "Bot gönderisi",
        body: "Honeypot alanı doldurulmuş bir gönderi.",
        category: "genel",
        website: "https://spam.example",
      },
    });
    ensure(honeypot.status === 400, "honeypot doluysa 400");
    ensure(errorField(honeypot.data) === "website", "honeypot hatası website alanında");

    const htmlPost = await api("/api/board", {
      method: "POST",
      ip: HTML_IP,
      body: {
        authorName: "Güvenlik Testi",
        title: "<b>HTML başlık</b>",
        body: '<script>alert("x")</script> düz metin olarak saklanır.',
        category: "duyuru",
      },
    });
    ensure(htmlPost.status === 201, "HTML benzeri metin kabul edildi");
    const htmlRecord = (htmlPost.data as PostResponse).post;
    ensure(htmlRecord.title === "<b>HTML başlık</b>", "başlık metni bozulmadı");
    ensure(
      htmlRecord.body.includes("<script>"),
      "gövde ham metin olarak döndü (React tarafında kaçışlanır)",
    );

    const unsupportedType = await api("/api/board", {
      method: "POST",
      ip: "198.51.100.40",
      contentType: "text/plain",
      rawBody: "düz metin",
    });
    ensure(unsupportedType.status === 415, "text/plain gövde 415");
    ensure(
      errorCode(unsupportedType.data) === "UNSUPPORTED_MEDIA_TYPE",
      "415 kodu UNSUPPORTED_MEDIA_TYPE",
    );

    const invalidJson = await api("/api/board", {
      method: "POST",
      ip: "198.51.100.40",
      rawBody: "{bozuk",
    });
    ensure(invalidJson.status === 400, "bozuk JSON 400");
    ensure(errorCode(invalidJson.data) === "INVALID_JSON", "bozuk JSON kodu INVALID_JSON");

    let lastStatus = 0;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const limited = await api("/api/board", {
        method: "POST",
        ip: LIMIT_IP,
        body: {
          authorName: "x",
          title: "Limit denemesi",
          body: "Bu istek doğrulamadan önce limite takılmalı.",
          category: "genel",
        },
      });
      lastStatus = limited.status;
      ensure(limited.status === 400, `limit öncesi ${attempt}. istek doğrulama 400`);
    }
    ensure(lastStatus === 400, "beş doğrulama denemesi tükendi");

    const rateLimited = await api("/api/board", {
      method: "POST",
      ip: LIMIT_IP,
      body: {
        authorName: "x",
        title: "Limit denemesi",
        body: "Bu istek 429 dönmeli.",
        category: "genel",
      },
    });
    ensure(rateLimited.status === 429, "saatlik limit 6. istekte 429");
    ensure(errorCode(rateLimited.data) === "RATE_LIMITED", "429 kodu RATE_LIMITED");
    ensure(
      rateLimited.headers.get("retry-after") !== null,
      "429 Retry-After başlığı içeriyor",
    );

    const pin = await api(`/api/admin/posts/${created.id}`, {
      method: "PATCH",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
      body: { pinned: true },
    });
    ensure(pin.status === 200, "admin gönderiyi sabitledi");
    ensure((pin.data as PostResponse).post.pinned === true, "pin yanıtı pinned=true");

    const pinnedBoard = await api("/api/board?limit=50");
    const pinnedList = (pinnedBoard.data as BoardResponse).posts;
    ensure(pinnedList[0]?.id === created.id, "sabitlenen gönderi panonun başında");
    ensure(pinnedList[0]?.pinned === true, "ilk gönderi sabit");

    const unpin = await api(`/api/admin/posts/${created.id}`, {
      method: "PATCH",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
      body: { pinned: false },
    });
    ensure(unpin.status === 200, "admin sabitlemeyi kaldırdı");
    ensure((unpin.data as PostResponse).post.pinned === false, "unpin yanıtı pinned=false");

    const adminCreatedPost = await api("/api/admin/posts", {
      method: "POST",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
      body: {
        authorName: "BAL Yönetimi",
        title: "Yönetim duyurusu",
        body: "Yönetim uçlarından oluşturulan sabit duyuru.",
        category: "duyuru",
        pinned: true,
      },
    });
    ensure(adminCreatedPost.status === 201, "admin gönderisi 201");
    const adminPost = (adminCreatedPost.data as PostResponse).post;
    ensure(adminPost.pinned === true, "admin gönderisi sabit oluşturuldu");

    const createClub = await api("/api/admin/clubs", {
      method: "POST",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
      body: {
        name: "Smoke Kulübü",
        slug: "smoke-kulup",
        description: "Uçtan uca test için oluşturulmuş geçici topluluk.",
        category: "sanat",
        meetingNote: "Test toplantısı",
        contact: "smoke@bal.example",
      },
    });
    ensure(createClub.status === 201, "admin topluluk oluşturdu");
    const newClub = (createClub.data as ClubResponse).club;
    ensure(newClub.slug === "smoke-kulup", "yeni topluluk adresi doğru");

    const clubsAfterCreate = await api("/api/clubs");
    ensure(
      (clubsAfterCreate.data as ClubsResponse).clubs.length === 7,
      "topluluk listesi 7 kayıt",
    );

    const duplicateClub = await api("/api/admin/clubs", {
      method: "POST",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
      body: {
        name: "Başka Kulüp",
        slug: "smoke-kulup",
        description: "Aynı adresle ikinci topluluk oluşturulmamalı.",
        category: "diğer",
      },
    });
    ensure(duplicateClub.status === 409, "yinelenen topluluk adresi 409");
    ensure(errorCode(duplicateClub.data) === "CLUB_EXISTS", "409 kodu CLUB_EXISTS");

    const eventStart = Date.now() + 3 * 24 * 60 * 60 * 1000;
    const createEvent = await api("/api/admin/events", {
      method: "POST",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
      body: {
        clubSlug: "smoke-kulup",
        title: "Smoke etkinliği",
        description: "Uçtan uca test için oluşturulmuş geçici etkinlik.",
        startsAt: new Date(eventStart).toISOString(),
        location: "Test salonu",
      },
    });
    ensure(createEvent.status === 201, "admin etkinlik oluşturdu");
    const newEvent = (createEvent.data as EventResponse).event;
    ensure(newEvent.clubSlug === "smoke-kulup", "etkinlik kulübe bağlandı");

    const eventsAfterCreate = await api("/api/events");
    ensure(
      (eventsAfterCreate.data as EventsResponse).events.some(
        (event) => event.id === newEvent.id,
      ),
      "yeni etkinlik yaklaşanlar listesinde",
    );

    const deleteEvent = await api(`/api/admin/events/${newEvent.id}`, {
      method: "DELETE",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
    });
    ensure(deleteEvent.status === 204, "admin etkinliği sildi");
    const deleteEventAgain = await api(`/api/admin/events/${newEvent.id}`, {
      method: "DELETE",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
    });
    ensure(deleteEventAgain.status === 404, "silinen etkinlik ikinci kez 404");

    const deletePost = await api(`/api/admin/posts/${created.id}`, {
      method: "DELETE",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
    });
    ensure(deletePost.status === 204, "admin gönderiyi sildi");

    const boardAfterDelete = await api("/api/board?limit=50");
    ensure(
      !(boardAfterDelete.data as BoardResponse).posts.some(
        (post) => post.id === created.id,
      ),
      "silinen gönderi panodan kalktı",
    );

    const deleteAdminPost = await api(`/api/admin/posts/${adminPost.id}`, {
      method: "DELETE",
      ip: ADMIN_IP,
      adminToken: TEST_ADMIN_TOKEN,
    });
    ensure(deleteAdminPost.status === 204, "admin kendi gönderisini sildi");

    const unknownApi = await api("/api/bilinmeyen");
    ensure(unknownApi.status === 404, "bilinmeyen API yolu 404");

    console.log("\nSmoke test başarılı.");
  } finally {
    if (running) await running.close();
    ctx?.close();
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error("\nSmoke test başarısız:");
  console.error(error);
  process.exitCode = 1;
});
