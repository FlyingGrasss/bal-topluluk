import Link from "next/link";
import type { EventDto } from "@shared/types";
import { Icon } from "@/components/ui/Icon";
import { formatEventDay, formatTime } from "@/lib/format";

export function EventCard({ event }: { event: EventDto }) {
  const day = formatEventDay(event.startsAt);

  return (
    <article className="flex gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5">
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
        <span className="text-[11px] font-medium uppercase leading-4">
          {day.weekday}
        </span>
        <span className="text-xl font-bold leading-6">{day.day}</span>
        <span className="text-[11px] font-medium leading-4">{day.month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="break-words text-base font-semibold leading-6 text-[color:var(--text)]">
          {event.title}
        </h3>
        <p className="mt-1 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
          {event.description}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[color:var(--muted)]">
          <Link
            className="rounded font-medium underline-offset-4 hover:text-[color:var(--text)] hover:underline"
            href={`/topluluklar/${event.clubSlug}`}
          >
            {event.clubName}
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={13} />
            <time dateTime={new Date(event.startsAt).toISOString()}>
              {formatTime(event.startsAt)}
            </time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="map-pin" size={13} />
            {event.location}
          </span>
        </div>
      </div>
    </article>
  );
}
