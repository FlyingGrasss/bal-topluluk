import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/board/PostCard";
import { EventCard } from "@/components/events/EventCard";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatCount } from "@/lib/format";
import { getBoard, getClubs, getEvents } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "BAL Topluluk — Mahallenin dijital panosu" },
  description:
    "Kulüpleri keşfet, yaklaşan etkinlikleri gör ve mahallenin dijital panosunda duyuru, soru ve etkinlik paylaş.",
};

const STEPS = [
  {
    title: "Topluluğunu bul",
    detail:
      "Satrançtan robotiğe, müzikten çevreye uzanan kulüpleri incele; buluşma notlarını ve yaklaşan etkinlikleri gör.",
  },
  {
    title: "Panoya yaz",
    detail:
      "Adınla birlikte duyuru, etkinlik, soru veya genel bir not bırak. Hesap açman gerekmez.",
  },
  {
    title: "Buluşmaya gel",
    detail:
      "Etkinlik takvimini takip et, topluluk sayfasındaki buluşma notuyla yerini ve saatini öğren.",
  },
] as const;

export default async function HomePage() {
  const [clubsResult, eventsResult, boardResult] = await Promise.allSettled([
    getClubs(),
    getEvents(),
    getBoard({ limit: 5 }),
  ]);

  const clubs = clubsResult.status === "fulfilled" ? clubsResult.value : null;
  const events = eventsResult.status === "fulfilled" ? eventsResult.value : null;
  const board = boardResult.status === "fulfilled" ? boardResult.value : null;
  const featured = board
    ? board.posts.filter((post) => post.pinned).slice(0, 2)
    : [];
  const latest = board ? board.posts.slice(0, 5) : [];

  return (
    <main className="w-full" id="icerik">
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:pb-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-medium text-[color:var(--muted)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[color:var(--brand)]"
              />
              BAL · mahalle topluluk platformu
            </p>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-[color:var(--text)] sm:text-5xl">
              BAL Topluluk
            </h1>
            <p className="mt-3 max-w-xl text-xl font-semibold leading-8 text-[color:var(--text)] sm:text-2xl">
              Kulüpler, etkinlikler ve mahallenin dijital panosu tek yerde.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--muted)]">
              Toplulukları keşfet, yaklaşan buluşmaları kaçırma ve panoda
              duyurularını paylaş. Panoya yazmak için hesap açman gerekmez;
              yalnızca adın yeter.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link className={buttonClasses("primary", "md")} href="/pano">
                Panoya göz at
                <Icon name="arrow-right" size={15} />
              </Link>
              <Link
                className={buttonClasses("secondary", "md")}
                href="/topluluklar"
              >
                Toplulukları keşfet
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-[color:var(--border)] pt-5">
              <div>
                <dt className="text-xs text-[color:var(--muted)]">Topluluk</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--text)]">
                  {clubs ? formatCount(clubs.length) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--muted)]">Pano gönderisi</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--text)]">
                  {board ? formatCount(board.total) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--muted)]">Yaklaşan etkinlik</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-[color:var(--text)]">
                  {events ? formatCount(events.length) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[color:var(--text)]">
                {featured.length > 0 ? "Sabitlenmiş duyurular" : "Panodan"}
              </h2>
              <Link
                className="rounded text-xs font-medium text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--text)] hover:underline"
                href="/pano"
              >
                Panoya git
              </Link>
            </div>

            {board === null ? (
              <p className="mt-4 rounded-lg border border-dashed border-[color:var(--border-strong)] px-3 py-4 text-sm leading-6 text-[color:var(--muted)]">
                Pano şu anda yüklenemedi. Biraz sonra tekrar deneyebilirsin.
              </p>
            ) : featured.length === 0 && latest.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-[color:var(--border-strong)] px-3 py-4 text-sm leading-6 text-[color:var(--muted)]">
                Pano henüz boş. İlk gönderiyi sen bırakabilirsin.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[color:var(--border)]">
                {(featured.length > 0 ? featured : latest.slice(0, 2)).map(
                  (post) => (
                    <li className="py-3" key={post.id}>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--brand)]">
                          {post.pinned ? "Sabit" : "Yeni"}
                        </span>
                        <span className="truncate text-xs text-[color:var(--muted)]">
                          {post.clubName ?? "Genel pano"}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold leading-6 text-[color:var(--text)]">
                        {post.title}
                      </p>
                    </li>
                  ),
                )}
              </ul>
            )}

            <div className="mt-4 rounded-lg border border-dashed border-[color:var(--border)] bg-[color:var(--bg)] px-3 py-3 text-xs leading-5 text-[color:var(--muted)]">
              Pano herkese açık. Kişisel bilgi paylaşmadan önce bir kez düşün.
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="upcoming-title"
        className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight text-[color:var(--text)]"
              id="upcoming-title"
            >
              Yaklaşan etkinlikler
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Tarihleri not et; topluluk sayfalarında ayrıntılar var.
            </p>
          </div>
          <Link
            className="rounded text-sm font-medium text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--text)] hover:underline"
            href="/etkinlikler"
          >
            Tüm etkinlikler
          </Link>
        </div>

        {events === null ? (
          <p className="mt-5 rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-5 text-sm text-[color:var(--muted)]">
            Etkinlikler şu anda yüklenemedi.
          </p>
        ) : events.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-5 text-sm text-[color:var(--muted)]">
            Takvimde yaklaşan etkinlik yok.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.slice(0, 3).map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="latest-title"
        className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight text-[color:var(--text)]"
              id="latest-title"
            >
              Panodan son gönderiler
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Duyurular, sorular ve mahalle notları.
            </p>
          </div>
          <Link
            className="rounded text-sm font-medium text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--text)] hover:underline"
            href="/pano"
          >
            Tüm panoyu gör
          </Link>
        </div>

        {board === null ? (
          <p className="mt-5 rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-5 text-sm text-[color:var(--muted)]">
            Pano şu anda yüklenemedi.
          </p>
        ) : latest.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-5 text-sm text-[color:var(--muted)]">
            Pano henüz boş. İlk gönderiyi sen bırakabilirsin.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {latest.map((post) => (
              <PostCard compact key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="how-title"
        className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12"
      >
        <h2
          className="text-2xl font-semibold tracking-tight text-[color:var(--text)]"
          id="how-title"
        >
          Pano nasıl işler?
        </h2>
        <div className="mt-6 grid gap-6 border-t border-[color:var(--border)] pt-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title}>
              <span className="text-xs font-semibold tabular-nums text-[color:var(--brand)]">
                0{index + 1}
              </span>
              <h3 className="mt-2 text-base font-semibold text-[color:var(--text)]">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-[color:var(--muted)]">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
        <div className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--text)]">
              Bir duyurun mu var?
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Panoya bırak; mahalle görsün. Yalnızca adın yeter.
            </p>
          </div>
          <Link
            className={buttonClasses("primary", "md")}
            href="/pano#yeni-gonderi"
          >
            Gönderi paylaş
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
