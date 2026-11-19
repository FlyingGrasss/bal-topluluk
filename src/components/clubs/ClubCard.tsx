import Link from "next/link";
import type { ClubDto } from "@shared/types";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { CLUB_CATEGORY_LABELS } from "@/lib/labels";

export function ClubCard({ club }: { club: ClubDto }) {
  return (
    <Link
      className="group flex flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition-colors hover:border-[color:var(--border-strong)]"
      href={`/topluluklar/${club.slug}`}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge>{CLUB_CATEGORY_LABELS[club.category]}</Badge>
        <Icon
          className="text-[color:var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[color:var(--text)]"
          name="arrow-right"
          size={16}
        />
      </div>

      <h2 className="mt-3 text-lg font-semibold tracking-tight text-[color:var(--text)]">
        {club.name}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--muted)]">
        {club.description}
      </p>

      {club.meetingNote ? (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[color:var(--muted)]">
          <Icon className="mt-0.5 shrink-0" name="calendar" size={14} />
          <span>{club.meetingNote}</span>
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[color:var(--border)] pt-3 text-xs text-[color:var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="pin" size={13} />
          {club.postCount} gönderi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="calendar" size={13} />
          {club.upcomingEventCount} yaklaşan etkinlik
        </span>
      </div>
    </Link>
  );
}
