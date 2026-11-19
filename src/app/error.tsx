"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6"
      id="icerik"
    >
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">
          Bağlantı sorunu
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[color:var(--text)]">
          İçerik yüklenemedi
        </h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Topluluk servisine ulaşılamadı ya da beklenmeyen bir hata oluştu.
          Bağlantını kontrol edip yeniden deneyebilirsin.
        </p>
        <Button className="mt-6" onClick={reset}>
          Tekrar dene
        </Button>
      </div>
    </main>
  );
}
