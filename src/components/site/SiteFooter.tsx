import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/topluluklar", label: "Topluluklar" },
  { href: "/pano", label: "Pano" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/admin", label: "Yönetim" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[color:var(--border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-[color:var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>BAL Topluluk · Mahallenin dijital panosu.</p>
        <nav aria-label="Alt menü" className="flex flex-wrap gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              className="rounded underline-offset-4 hover:text-[color:var(--text)] hover:underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
