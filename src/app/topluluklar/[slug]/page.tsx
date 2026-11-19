import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PostCard } from "@/components/board/PostCard";
import { EventCard } from "@/components/events/EventCard";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/format";
import { CLUB_CATEGORY_LABELS } from "@/lib/labels";
import { getClubDetail } from "@/lib/server-api";

export const dynamic = "force-dynamic";

const loadClub = cache(async (slug: string) => getClubDetail(slug));

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ClubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await loadClub(slug);

  if (!detail) {
    return {
      title: "Topluluk bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: detail.club.name,
    description: detail.club.description,
  };
}

export default async function ClubDetailPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const detail = await loadClub(slug);
  if (!detail) notFound();

  const { club, posts, events } = detail;

  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
      id="icerik"
    >
      <nav aria-label="Sayfa yolu" className="text-xs text-[color:var(--muted)]">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              className="rounded underline-offset-4 hover:text-[color:var(--text)] hover:underline"
              href="/topluluklar"
            >
              Topluluklar
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-[color:var(--text)]">
            {club.name}
          </li>
        </ol>
      </nav>

      <header className="mt-4 border-b border-[color:var(--border)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">
          {CLUB_CATEGORY_LABELS[club.category]}
        </p>
        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text)] sm:text-4xl">
              {club.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              {club.description}
            </p>
          </div>
          <Link
            className={buttonClasses("secondary", "md", "shrink-0")}
            href={`/pano?topluluk=${club.slug}#yeni-gonderi`}
          >
            Bu topluluk adına paylaş
            <Icon name="plus" size={15} />
          </Link>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {club.meetingNote ? (
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--muted)]">
                <Icon name="calendar" size={13} />
                Buluşma
              </dt>
              <dd className="mt-1 text-sm leading-6 text-[color:var(--text)]">
                {club.meetingNote}
              </dd>
            </div>
          ) : null}

          {club.contact ? (
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5">
              <dt className="flex items-center gap-1.5 text-xs font-medium text-[color:var(--muted)]">
                <Icon name="users" size={13} />
                İletişim
              </dt>
              <dd className="mt-1 break-words text-sm leading-6 text-[color:var(--text)]">
                {club.contact}
              </dd>
            </div>
          ) : null}

          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2.5">
            <dt className="text-xs font-medium text-[color:var(--muted)]">
              Pano ve takvim
            </dt>
            <dd className="mt-1 text-sm leading-6 text-[color:var(--text)]">
              {club.postCount} gönderi · {club.upcomingEventCount} yaklaşan etkinlik
            </dd>
            <dd className="mt-0.5 text-xs text-[color:var(--muted)]">
              Kurulduğu tarih: {formatDate(club.createdAt)}
            </dd>
          </div>
        </dl>
      </header>

      {events.length > 0 ? (
        <section aria-labelledby="club-events-title" className="mt-8">
          <h2
            className="text-xl font-semibold tracking-tight text-[color:var(--text)]"
            id="club-events-title"
          >
            Yaklaşan etkinlikler
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="club-posts-title" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2
            className="text-xl font-semibold tracking-tight text-[color:var(--text)]"
            id="club-posts-title"
          >
            Topluluk panosu
          </h2>
          <Link
            className="rounded text-sm font-medium text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--text)] hover:underline"
            href="/pano"
          >
            Tüm panoya git
          </Link>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            className="mt-4"
            description="Bu topluluk adına henüz gönderi paylaşılmamış. İlk notu sen bırakabilirsin."
            icon="pin"
            title="Topluluk panosu boş"
          />
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
