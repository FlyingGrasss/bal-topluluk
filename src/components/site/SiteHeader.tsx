import Link from "next/link";
import { SiteNav } from "./SiteNav";

export function SiteHeader() {
  return (
    <header className="border-b border-[color:var(--border)] bg-[color:var(--bg)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            className="inline-flex items-center gap-2.5 rounded-lg text-sm font-semibold tracking-tight text-[color:var(--text)]"
            href="/"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--brand)] text-sm font-bold text-white"
            >
              B
            </span>
            <span className="truncate">BAL Topluluk</span>
          </Link>
          <span className="hidden text-xs text-[color:var(--muted)] sm:inline md:hidden lg:inline">
            Mahallenin dijital panosu
          </span>
        </div>
        <SiteNav />
      </div>
    </header>
  );
}
