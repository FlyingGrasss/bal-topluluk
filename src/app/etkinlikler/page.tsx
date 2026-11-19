import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { PageHeader } from "@/components/site/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCount } from "@/lib/format";
import { getEvents } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Etkinlikler",
  description:
    "BAL topluluklarının yaklaşan etkinlikleri: satranç turnuvası, robotik demo günü, açık sahne akşamı ve daha fazlası.",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      id="icerik"
    >
      <PageHeader
        description="Toplulukların yaklaşan buluşmaları ve açık etkinlikleri. Tarihleri not et, katılmak için topluluk sayfasına göz at."
        eyebrow="Takvim"
        title="Etkinlikler"
      />

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-[color:var(--muted)]">
          {formatCount(events.length)} yaklaşan etkinlik
        </p>
        <p className="text-xs text-[color:var(--muted)]">
          Saatler Türkiye saatine göredir.
        </p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          className="mt-6"
          description="Takvimde şu anda yaklaşan etkinlik yok. Panodan yeni bir buluşma duyurusu paylaşabilirsin."
          icon="calendar"
          title="Yaklaşan etkinlik yok"
          action={
            <Link className={buttonClasses("primary", "sm")} href="/pano">
              Panoya git
            </Link>
          }
        />
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </div>
      )}
    </main>
  );
}
