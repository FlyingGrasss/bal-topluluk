import type { Metadata } from "next";
import { ClubCard } from "@/components/clubs/ClubCard";
import { PageHeader } from "@/components/site/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getClubs } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Topluluklar",
  description:
    "Satranç, robotik, müzik, tiyatro, girişimcilik ve çevre topluluklarını keşfet; buluşma notlarını ve etkinlikleri gör.",
};

export default async function ClubsPage() {
  const clubs = await getClubs();

  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-12"
      id="icerik"
    >
      <PageHeader
        description="Her topluluk kendi ritminde buluşuyor. Birini seç, buluşma notuna göz at ve panodaki gönderilerini oku."
        eyebrow="Keşfet"
        title="Topluluklar"
      />

      <p className="mt-4 text-sm text-[color:var(--muted)]">
        {clubs.length} topluluk listeleniyor.
      </p>

      {clubs.length === 0 ? (
        <EmptyState
          className="mt-8"
          description="Yönetim panelinden ilk topluluğu ekleyebilirsin."
          icon="users"
          title="Henüz topluluk yok"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <ClubCard club={club} key={club.id} />
          ))}
        </div>
      )}
    </main>
  );
}
