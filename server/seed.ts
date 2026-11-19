import type { ClubCategory, PostCategory } from "../shared/types.js";
import { countClubs, insertClub } from "./repos/clubs.js";
import { countPinnedPosts, countPosts, insertPost } from "./repos/posts.js";
import { countUpcomingEvents, insertEvent } from "./repos/events.js";
import { openDatabase, type AppDatabase } from "./db.js";
import { resolveConfig } from "./config.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const istanbulDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface ClubSpec {
  name: string;
  slug: string;
  description: string;
  category: ClubCategory;
  meetingNote: string;
  contact: string;
}

const CLUBS: ClubSpec[] = [
  {
    name: "Satranç Kulübü",
    slug: "satranc",
    description:
      "Haftalık turnuvalar, açılış analizleri ve yeni başlayanlar için sabırlı bir satranç masası. Taşlar hazır, sen yeter ki gel.",
    category: "spor",
    meetingNote: "Her çarşamba 17.30 · Kütüphane toplantı odası",
    contact: "satranc@bal.example",
  },
  {
    name: "Robotik Atölyesi",
    slug: "robotik",
    description:
      "Sensörden motora, çizgi izleyen robottan mini karta kadar birlikte üretiyoruz. Elektroniğe meraklı herkes davetli.",
    category: "bilim",
    meetingNote: "Cumartesi 11.00 · Atölye 2",
    contact: "robotik@bal.example",
  },
  {
    name: "Müzik Topluluğu",
    slug: "muzik",
    description:
      "Koro, akustik akşamlar ve enstrüman paylaşımı. İster sahneye çık, ister dinleyici olarak katıl; müziğin bir yeri var.",
    category: "müzik",
    meetingNote: "Perşembe 19.00 · Müzik odası",
    contact: "muzik@bal.example",
  },
  {
    name: "Tiyatro Sahnesi",
    slug: "tiyatro",
    description:
      "Metin okumalarından sahne çalışmalarına uzanan bir sezon programı hazırlıyoruz. Sahne arkası ekibi de en az oyuncular kadar değerli.",
    category: "sanat",
    meetingNote: "Salı 18.30 · Konferans salonu",
    contact: "tiyatro@bal.example",
  },
  {
    name: "Girişimcilik Kulübü",
    slug: "girisimcilik",
    description:
      "Fikirleri küçük deneylere dönüştüren bir topluluk. Haftalık fikir masası, mentor buluşmaları ve sunum pratikleri yapıyoruz.",
    category: "girişim",
    meetingNote: "İki haftada bir cuma 18.00 · Toplantı odası A",
    contact: "girisim@bal.example",
  },
  {
    name: "Çevre Ekibi",
    slug: "cevre",
    description:
      "Mahallede ve kampüste daha az atık, daha çok yeşil alan için çalışıyoruz. Temizlik günleri, tamir atölyeleri ve farkındalık etkinlikleri düzenliyoruz.",
    category: "diğer",
    meetingNote: "Pazar 10.00 · Ana giriş buluşma noktası",
    contact: "cevre@bal.example",
  },
];

interface PostSpec {
  clubSlug: string | null;
  authorName: string;
  title: string;
  body: string;
  category: PostCategory;
  pinned: boolean;
  ageMs: number;
}

const POSTS: PostSpec[] = [
  {
    clubSlug: null,
    authorName: "BAL Yönetimi",
    title: "Pano kullanım kuralları",
    body:
      "Pano; duyuru, etkinlik, soru ve genel sohbet için ortak alanımız. Bir gönderi paylaşırken başlığı açık yaz, kişisel bilgi paylaşma ve aynı konuyu tekrar açmadan önce kısa bir göz at. Yönetim uygunsuz gönderileri kaldırabilir.",
    category: "duyuru",
    pinned: true,
    ageMs: 6 * DAY,
  },
  {
    clubSlug: null,
    authorName: "BAL Yönetimi",
    title: "Bahar dönemi etkinlik takvimi yayında",
    body:
      "Bahar döneminde satranç turnuvası, robotik demo günü ve açık sahne akşamı var. Etkinlikler sayfasından tarihlere göz atabilir, topluluk sayfalarından ayrıntılara ulaşabilirsin. Takvim yeni etkinliklerle güncellenecek.",
    category: "duyuru",
    pinned: true,
    ageMs: 5 * DAY,
  },
  {
    clubSlug: "robotik",
    authorName: "Deniz Y.",
    title: "Çizgi izleyen robot atölyesi başlıyor",
    body:
      "Sensör kalibrasyonundan motor sürücüsüne kadar iki oturumluk bir atölye planladık. Malzeme kulüpten; yanında sadece merak getir. Cumartesi 11.00'de Atölye 2'de buluşuyoruz.",
    category: "etkinlik",
    pinned: false,
    ageMs: 3 * DAY,
  },
  {
    clubSlug: "satranc",
    authorName: "Elif K.",
    title: "Yeni başlayanlar için satranç grubu var mı?",
    body:
      "Daha önce hiç turnuvaya katılmadım ama öğrenmek istiyorum. Çarşamba buluşmalarına yeni başlayanlarla birlikte gelebileceğimiz ayrı bir masa açılır mı? Taşları yeni öğrenen biri olarak çekinmeden gelmek isterim.",
    category: "soru",
    pinned: false,
    ageMs: 2 * DAY,
  },
  {
    clubSlug: "muzik",
    authorName: "Mert A.",
    title: "Koro provası için piyano arıyoruz",
    body:
      "Perşembe akşamı prova yapacağımız salonun piyanosu bakımda. Müzik odasının yanındaki küçük piyanoyu kullanabilir miyiz, yoksa bu hafta akustik çalışmaya mı dönelim? Fikri olan yazsın.",
    category: "genel",
    pinned: false,
    ageMs: 30 * HOUR,
  },
  {
    clubSlug: "tiyatro",
    authorName: "Tiyatro Sahnesi",
    title: "Sezon oyunu için seçmeler",
    body:
      "Bu sezon sahneleyeceğimiz oyunun metni hazır. Oyuncular kadar ışık, ses ve dekor ekibine de ihtiyacımız var. Salı 18.30'da konferans salonunda kısa bir tanışma ve metin okuması yapacağız.",
    category: "duyuru",
    pinned: false,
    ageMs: 20 * HOUR,
  },
  {
    clubSlug: "cevre",
    authorName: "Selin D.",
    title: "Cumartesi sahil temizliği",
    body:
      "Eldiven ve torba temin edilecek. Saat 09.30'da ana girişte buluşup sahil hattında iki saatlik bir temizlik yapacağız. Yanında yeniden kullanılabilir su şişesi getirmeyi unutma.",
    category: "etkinlik",
    pinned: false,
    ageMs: 8 * HOUR,
  },
  {
    clubSlug: "girisimcilik",
    authorName: "Zeynep",
    title: "Fikir masasına bu hafta ne getirelim?",
    body:
      "Cuma günkü fikir masası için birkaç başlık topluyorum: mahalle içi paylaşım uygulaması, atık azaltma deneyi ve etkinlik bulma aracı. Elinde küçük bir fikir ya da tek bir soru varsa yorumlarda paylaşabilirsin.",
    category: "genel",
    pinned: false,
    ageMs: 2 * HOUR,
  },
];

interface EventSpec {
  clubSlug: string;
  title: string;
  description: string;
  daysFromNow: number;
  hour: number;
  minute: number;
  location: string;
}

const EVENTS: EventSpec[] = [
  {
    clubSlug: "satranc",
    title: "Bahar satranç turnuvası",
    description:
      "Beş tur hızlı satranç turnuvası. Yeni başlayanlar için ayrı bir masa ve kısa bir kurallar tanıtımı olacak.",
    daysFromNow: 2,
    hour: 18,
    minute: 30,
    location: "Kütüphane toplantı odası",
  },
  {
    clubSlug: "robotik",
    title: "Robotik demo günü",
    description:
      "Dönem boyunca hazırlanan çizgi izleyen robotlar ve sensör deneyleri sergilenecek. Atölyeyi merak edenler için açık kapı günü.",
    daysFromNow: 5,
    hour: 11,
    minute: 0,
    location: "Atölye 2",
  },
  {
    clubSlug: "tiyatro",
    title: "Açık sahne akşamı",
    description:
      "Kısa oyunlar, doğaçlama bölümleri ve sezon programının tanıtımı. Sahne arkası ekibiyle tanışmak için de iyi bir fırsat.",
    daysFromNow: 9,
    hour: 19,
    minute: 0,
    location: "Konferans salonu",
  },
];

export interface SeedCounts {
  clubs: number;
  posts: number;
  pinnedPosts: number;
  upcomingEvents: number;
}

export function resetDatabase(db: AppDatabase): void {
  db.exec(`
    DELETE FROM posts;
    DELETE FROM events;
    DELETE FROM clubs;
    DELETE FROM sqlite_sequence
      WHERE name IN ('posts', 'events', 'clubs');
  `);
}

export function seedDatabase(
  db: AppDatabase,
  now: number = Date.now(),
): SeedCounts {
  const clubIds = new Map<string, number>();

  CLUBS.forEach((spec, index) => {
    const club = insertClub(db, {
      name: spec.name,
      slug: spec.slug,
      description: spec.description,
      category: spec.category,
      meetingNote: spec.meetingNote,
      contact: spec.contact,
      createdAt: now - 90 * DAY + index * DAY,
    });
    clubIds.set(spec.slug, club.id);
  });

  for (const spec of POSTS) {
    const clubId = spec.clubSlug ? clubIds.get(spec.clubSlug) : null;
    if (spec.clubSlug && clubId === undefined) {
      throw new Error(`[seed] Bilinmeyen topluluk: ${spec.clubSlug}`);
    }

    insertPost(db, {
      clubId: clubId ?? null,
      authorName: spec.authorName,
      title: spec.title,
      body: spec.body,
      category: spec.category,
      pinned: spec.pinned,
      createdAt: now - spec.ageMs,
    });
  }

  for (const spec of EVENTS) {
    const clubId = clubIds.get(spec.clubSlug);
    if (clubId === undefined) {
      throw new Error(`[seed] Bilinmeyen topluluk: ${spec.clubSlug}`);
    }

    insertEvent(db, {
      clubId,
      title: spec.title,
      description: spec.description,
      startsAt: futureAt(now, spec.daysFromNow, spec.hour, spec.minute),
      location: spec.location,
      createdAt: now - 4 * DAY,
    });
  }

  return verifyCounts(db, now);
}

function futureAt(
  now: number,
  days: number,
  hour: number,
  minute: number,
): number {
  // The UI formats every date in Europe/Istanbul. Build the seed timestamp
  // from the Istanbul calendar date so a UTC container still shows the
  // intended local hour (Türkiye is UTC+3 year-round).
  const parts = istanbulDateFormatter.formatToParts(new Date(now));
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((item) => item.type === type)?.value ?? "0");

  return Date.UTC(
    part("year"),
    part("month") - 1,
    part("day") + days,
    hour - 3,
    minute,
    0,
    0,
  );
}

function verifyCounts(db: AppDatabase, now: number): SeedCounts {
  const counts: SeedCounts = {
    clubs: countClubs(db),
    posts: countPosts(db),
    pinnedPosts: countPinnedPosts(db),
    upcomingEvents: countUpcomingEvents(db, now),
  };

  const valid =
    counts.clubs === 6 &&
    counts.posts === 8 &&
    counts.pinnedPosts === 2 &&
    counts.upcomingEvents >= 3;

  if (!valid) {
    throw new Error(
      `[seed] Beklenen demo sayıları tutmadı: ${JSON.stringify(counts)}`,
    );
  }
  return counts;
}

function hasAnyData(db: AppDatabase): boolean {
  const row = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM clubs) +
         (SELECT COUNT(*) FROM posts) +
         (SELECT COUNT(*) FROM events) AS count`,
    )
    .get() as { count: number };
  return row.count > 0;
}

function printSummary(counts: SeedCounts): void {
  console.log("[seed] Demo verisi hazır.");
  console.log(
    `[seed] ${counts.clubs} topluluk, ${counts.posts} gönderi ` +
      `(${counts.pinnedPosts} sabit), ${counts.upcomingEvents} yaklaşan etkinlik.`,
  );
  console.log("[seed] Pano: http://localhost:3000/pano");
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    // .env is optional; process environment and defaults are enough.
  }

  const args = new Set(process.argv.slice(2));
  const reset = args.has("--reset");
  const ifEmpty = args.has("--if-empty");
  const config = resolveConfig();

  if (reset && config.isProduction) {
    console.error("[seed] --reset üretim ortamında reddedildi.");
    process.exitCode = 1;
    return;
  }

  const db = openDatabase(config.dbPath);
  try {
    if (!reset && hasAnyData(db)) {
      if (ifEmpty) {
        console.log("[seed] Veri mevcut; --if-empty nedeniyle atlandı.");
        return;
      }
      throw new Error(
        "Veritabanında veri var. Temiz demo verisi için `pnpm seed:reset` çalıştır.",
      );
    }

    const counts = db.transaction(() => {
      if (reset) resetDatabase(db);
      return seedDatabase(db);
    })();

    printSummary(counts);
  } finally {
    db.close();
  }
}

const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
if (/\/server\/seed\.(ts|js)$/u.test(entry)) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[seed] Hata: ${message}`);
    process.exitCode = 1;
  });
}
