import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6"
      id="icerik"
    >
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--text)]">
          Burada bir şey yok
        </h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Aradığın sayfa taşınmış veya hiç var olmamış olabilir. Panoya dönüp
          güncel gönderilere göz atabilirsin.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link className={buttonClasses("primary", "md")} href="/pano">
            Panoya git
          </Link>
          <Link className={buttonClasses("secondary", "md")} href="/">
            Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
