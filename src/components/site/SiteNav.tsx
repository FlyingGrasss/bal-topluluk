"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Ana sayfa" },
  { href: "/topluluklar", label: "Topluluklar" },
  { href: "/pano", label: "Pano" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/admin", label: "Yönetim" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Ana menü" className="flex flex-wrap items-center gap-1">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-[color:var(--surface)] text-[color:var(--text)] shadow-[inset_0_0_0_1px_var(--border)]"
                : "text-[color:var(--muted)] hover:bg-[color:var(--elevated)] hover:text-[color:var(--text)]",
            )}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
