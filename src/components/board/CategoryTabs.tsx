import Link from "next/link";
import type { PostCategory } from "@shared/types";
import { POST_CATEGORIES } from "@shared/constants";
import { cn } from "@/lib/cn";
import { POST_CATEGORY_LABELS } from "@/lib/labels";

export type BoardCategory = PostCategory | "all";

export function CategoryTabs({ active }: { active: BoardCategory }) {
  const options: Array<{ value: BoardCategory; label: string; href: string }> =
    [
      { value: "all", label: "Tümü", href: "/pano#gonderiler" },
      ...POST_CATEGORIES.map((category) => ({
        value: category,
        label: POST_CATEGORY_LABELS[category],
        href: `/pano?kategori=${category}#gonderiler`,
      })),
    ];

  return (
    <nav aria-label="Pano kategorileri" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = active === option.value;
        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
              isActive
                ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--text)]",
            )}
            href={option.href}
            key={option.value}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
