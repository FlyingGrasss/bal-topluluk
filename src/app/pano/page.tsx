import type { Metadata } from "next";
import Link from "next/link";
import { CategoryTabs, type BoardCategory } from "@/components/board/CategoryTabs";
import { NewPostForm } from "@/components/board/NewPostForm";
import { PostCard } from "@/components/board/PostCard";
import { PageHeader } from "@/components/site/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { isPostCategory } from "@shared/validation";
import type { PostCategory } from "@shared/types";
import { formatCount } from "@/lib/format";
import { getBoard, getClubs } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dijital pano",
  description:
    "Mahallenin dijital panosu: duyurular, etkinlikler, sorular ve genel notlar. Hesap açmadan gönderi paylaş.",
};

const PAGE_LIMIT = 50;

interface BoardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function boardHref(options: {
  category?: PostCategory;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (options.category) params.set("kategori", options.category);
  if (options.page !== undefined && options.page > 1) {
    params.set("sayfa", String(options.page));
  }
  const query = params.toString();
  return `/pano${query ? `?${query}` : ""}#gonderiler`;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;
  const rawCategory = firstParam(params.kategori);
  const category =
    rawCategory && isPostCategory(rawCategory) ? rawCategory : undefined;

  const rawPage = firstParam(params.sayfa);
  const parsedPage = rawPage ? Number(rawPage) : 1;
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 100_000
      ? parsedPage
      : 1;

  const initialClubSlug = firstParam(params.topluluk) ?? "";

  const [board, clubs] = await Promise.all([
    getBoard({ category, page, limit: PAGE_LIMIT }),
    getClubs().catch(() => []),
  ]);

  const activeCategory: BoardCategory = category ?? "all";

  return (
    <main
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10"
      id="icerik"
    >
      <PageHeader
        description="Duyurular, etkinlikler, sorular ve mahalle notları. Panoya yazmak için hesap açman gerekmez."
        eyebrow="Ortak alan"
        title="Dijital pano"
      />

      <div className="mt-6">
        <CategoryTabs active={activeCategory} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-labelledby="board-list-title" className="scroll-mt-6" id="gonderiler">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              className="text-sm font-semibold text-[color:var(--text)]"
              id="board-list-title"
            >
              {formatCount(board.total)} gönderi
            </h2>
            <p className="text-xs text-[color:var(--muted)]">
              Sabit gönderiler önce gösterilir.
            </p>
          </div>

          {board.posts.length === 0 ? (
            <EmptyState
              className="mt-4"
              description={
                page > 1
                  ? "Bu sayfada gönderi yok. Önceki sayfaya dönebilirsin."
                  : category
                    ? "Bu kategoride henüz gönderi yok. İlk gönderiyi sen bırakabilirsin."
                    : "Pano henüz boş. İlk gönderiyi sen bırakabilirsin."
              }
              icon="pin"
              title="Gönderi bulunamadı"
              action={
                category ? (
                  <Link
                    className={buttonClasses("secondary", "sm")}
                    href="/pano#gonderiler"
                  >
                    Tüm kategoriler
                  </Link>
                ) : (
                  <Link
                    className={buttonClasses("primary", "sm")}
                    href="#yeni-gonderi"
                  >
                    Yeni gönderi
                  </Link>
                )
              }
            />
          ) : (
            <div className="mt-4 space-y-3">
              {board.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {board.total > board.limit || page > 1 ? (
            <nav
              aria-label="Pano sayfaları"
              className="mt-5 flex items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4"
            >
              {page > 1 ? (
                <Link
                  className={buttonClasses("secondary", "sm")}
                  href={boardHref({ category, page: page - 1 })}
                >
                  Önceki sayfa
                </Link>
              ) : (
                <span />
              )}

              <span className="text-xs text-[color:var(--muted)]">
                Sayfa {page}
              </span>

              {board.hasMore ? (
                <Link
                  className={buttonClasses("secondary", "sm")}
                  href={boardHref({ category, page: page + 1 })}
                >
                  Sonraki sayfa
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </section>

        <aside
          aria-label="Yeni gönderi"
          className="scroll-mt-6 lg:sticky lg:top-4"
          id="yeni-gonderi"
        >
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5">
            <NewPostForm
              clubs={clubs}
              defaultCategory={category}
              initialClubSlug={initialClubSlug}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}
