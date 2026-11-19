import type { ClubCategory, PostCategory } from "@shared/types";

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  duyuru: "Duyuru",
  etkinlik: "Etkinlik",
  soru: "Soru",
  genel: "Genel",
};

export const CLUB_CATEGORY_LABELS: Record<ClubCategory, string> = {
  müzik: "Müzik",
  spor: "Spor",
  bilim: "Bilim",
  sanat: "Sanat",
  girişim: "Girişim",
  diğer: "Diğer",
};
