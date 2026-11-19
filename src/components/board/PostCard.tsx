import Link from "next/link";
import type { PostDto } from "@shared/types";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelative } from "@/lib/format";
import { POST_CATEGORY_LABELS } from "@/lib/labels";

export function PostCard({
  post,
  compact = false,
}: {
  post: PostDto;
  compact?: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5",
        post.pinned && "border-[color:var(--brand-border)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{POST_CATEGORY_LABELS[post.category]}</Badge>
        {post.pinned ? (
          <Badge tone="brand">
            <Icon name="pin" size={11} />
            Sabit
          </Badge>
        ) : null}
        {post.clubSlug && post.clubName ? (
          <Link
            className="rounded text-xs font-medium text-[color:var(--muted)] underline-offset-4 hover:text-[color:var(--text)] hover:underline"
            href={`/topluluklar/${post.clubSlug}`}
          >
            {post.clubName}
          </Link>
        ) : (
          <span className="text-xs text-[color:var(--muted)]">Genel pano</span>
        )}
        <time
          className="ml-auto text-xs text-[color:var(--muted)]"
          dateTime={new Date(post.createdAt).toISOString()}
          title={formatDateTime(post.createdAt)}
        >
          {formatRelative(post.createdAt)}
        </time>
      </div>

      <h3 className="mt-2.5 break-words text-base font-semibold leading-6 text-[color:var(--text)]">
        {post.title}
      </h3>

      {/* User content is rendered as a React text node, so HTML is escaped. */}
      <p
        className={cn(
          "mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--muted)]",
          compact && "line-clamp-2",
        )}
      >
        {post.body}
      </p>

      <p className="mt-3 text-xs font-medium text-[color:var(--muted)]">
        {post.authorName}
      </p>
    </article>
  );
}
