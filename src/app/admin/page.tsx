import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const metadata: Metadata = {
  title: "Yönetim",
  description: "BAL Topluluk pano ve etkinlik yönetimi.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      id="icerik"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">
        Yönetim
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-[color:var(--text)] sm:text-4xl">
        Pano yönetimi
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
        Gönderileri sabitle veya kaldır, etkinlikleri yönet ve yeni topluluklar
        ekle. Bu sayfa arama motorlarına kapalıdır; her işlem yönetici anahtarı
        ile doğrulanır.
      </p>

      <AdminConsole />
    </main>
  );
}
