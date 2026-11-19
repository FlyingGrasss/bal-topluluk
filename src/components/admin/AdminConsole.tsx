"use client";

import { useState, type FormEvent } from "react";
import { CLUB_CATEGORIES } from "@shared/constants";
import type {
  ClubCategory,
  ClubDto,
  EventDto,
  PostDto,
} from "@shared/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toastSuccess } from "@/components/ui/Toaster";
import {
  ApiError,
  createAdminClub,
  createAdminEvent,
  deleteAdminEvent,
  deleteAdminPost,
  fetchBoard,
  fetchClubList,
  fetchEvents,
  setPostPinned,
  validateAdminToken,
} from "@/lib/api";
import { formatDateTime, formatRetryAfter } from "@/lib/format";
import { CLUB_CATEGORY_LABELS, POST_CATEGORY_LABELS } from "@/lib/labels";

interface AdminData {
  clubs: ClubDto[];
  posts: PostDto[];
  events: EventDto[];
  total: number;
}

interface ClubFormState {
  name: string;
  slug: string;
  description: string;
  category: ClubCategory;
  meetingNote: string;
  contact: string;
}

interface EventFormState {
  clubSlug: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
}

interface DeleteTarget {
  kind: "post" | "event";
  id: number;
  label: string;
}

const CLUB_FIELD_IDS: Record<string, string> = {
  name: "club-name",
  slug: "club-slug",
  description: "club-description",
  category: "club-category",
  meetingNote: "club-meeting-note",
  contact: "club-contact",
};

const EVENT_FIELD_IDS: Record<string, string> = {
  clubSlug: "event-club",
  title: "event-title",
  description: "event-description",
  startsAt: "event-starts-at",
  location: "event-location",
};

function makeEmptyClub(): ClubFormState {
  return {
    name: "",
    slug: "",
    description: "",
    category: "diğer",
    meetingNote: "",
    contact: "",
  };
}

function parseIstanbulDateTime(value: string): number {
  if (value === "") return Number.NaN;
  const normalized = value.length === 16 ? `${value}:00` : value;
  return Date.parse(`${normalized}+03:00`);
}

function makeEmptyEvent(clubSlug = ""): EventFormState {
  return {
    clubSlug,
    title: "",
    description: "",
    startsAt: "",
    location: "",
  };
}

function withoutField(
  errors: Record<string, string>,
  field: string,
): Record<string, string> {
  if (!(field in errors)) return errors;
  const next = { ...errors };
  delete next[field];
  return next;
}

function messageOf(error: unknown): string {
  if (error instanceof ApiError) {
    const retry =
      error.retryAfterMs !== undefined
        ? ` ${formatRetryAfter(error.retryAfterMs)}`
        : "";
    return `${error.message}${retry}`;
  }
  return "Beklenmeyen bir hata oluştu. Lütfen tekrar dene.";
}

function focusField(
  ids: Record<string, string>,
  errors: Record<string, string>,
): void {
  const firstField = Object.keys(errors)[0];
  if (!firstField) return;
  const id = ids[firstField];
  if (!id) return;
  window.requestAnimationFrame(() => document.getElementById(id)?.focus());
}

async function loadAdminData(): Promise<AdminData> {
  const [clubsResponse, board, eventsResponse] = await Promise.all([
    fetchClubList(),
    fetchBoard(50),
    fetchEvents(),
  ]);

  return {
    clubs: clubsResponse.clubs,
    posts: board.posts,
    events: eventsResponse.events,
    total: board.total,
  };
}

export function AdminConsole() {
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState<"locked" | "unlocked">("locked");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [data, setData] = useState<AdminData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [clubForm, setClubForm] = useState<ClubFormState>(makeEmptyClub);
  const [clubErrors, setClubErrors] = useState<Record<string, string>>({});
  const [clubFormError, setClubFormError] = useState<string | null>(null);
  const [creatingClub, setCreatingClub] = useState(false);

  const [eventForm, setEventForm] = useState<EventFormState>(makeEmptyEvent);
  const [eventErrors, setEventErrors] = useState<Record<string, string>>({});
  const [eventFormError, setEventFormError] = useState<string | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function lock(): void {
    setPhase("locked");
    setToken("");
    setData(null);
    setDataError(null);
    setActionError(null);
    setUnlockError(null);
    setBusyKey(null);
  }

  function handleAuthFailure(error: unknown): boolean {
    if (error instanceof ApiError && error.status === 401) {
      lock();
      setUnlockError("Anahtar geçersiz veya yetki sona erdi. Yeniden gir.");
      return true;
    }
    return false;
  }

  async function reload(activeToken: string): Promise<void> {
    setRefreshing(true);
    setDataError(null);
    try {
      const loaded = await loadAdminData();
      setData(loaded);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setDataError(messageOf(error));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleUnlock(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (unlocking) return;

    const candidate = token.trim();
    if (candidate === "") {
      setUnlockError("Yönetici anahtarını gir.");
      return;
    }

    setUnlocking(true);
    setUnlockError(null);

    try {
      await validateAdminToken(candidate);
    } catch (error) {
      setUnlockError(messageOf(error));
      setUnlocking(false);
      return;
    }

    setToken(candidate);
    setPhase("unlocked");
    setData(null);
    setDataError(null);
    setUnlocking(false);
    await reload(candidate);
  }

  function updateClub<K extends keyof ClubFormState>(
    field: K,
    value: ClubFormState[K],
  ): void {
    setClubForm((current) => ({ ...current, [field]: value }));
    setClubErrors((current) => withoutField(current, field));
    setClubFormError(null);
  }

  function updateEvent<K extends keyof EventFormState>(
    field: K,
    value: EventFormState[K],
  ): void {
    setEventForm((current) => ({ ...current, [field]: value }));
    setEventErrors((current) => withoutField(current, field));
    setEventFormError(null);
  }

  function validateClub(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (clubForm.name.trim().length < 2) {
      errors.name = "Topluluk adı en az 2 karakter olmalı.";
    }
    if (clubForm.slug.trim() !== "" && !/^[a-z0-9-]+$/u.test(clubForm.slug.trim())) {
      errors.slug = "Adres yalnızca küçük harf, sayı ve tire içerebilir.";
    }
    if (clubForm.description.trim().length < 10) {
      errors.description = "Açıklama en az 10 karakter olmalı.";
    }
    return errors;
  }

  function validateEvent(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (eventForm.clubSlug === "") {
      errors.clubSlug = "Bir topluluk seç.";
    }
    if (eventForm.title.trim().length < 3) {
      errors.title = "Etkinlik adı en az 3 karakter olmalı.";
    }
    if (eventForm.description.trim().length < 10) {
      errors.description = "Açıklama en az 10 karakter olmalı.";
    }
    if (eventForm.location.trim().length < 2) {
      errors.location = "Yer en az 2 karakter olmalı.";
    }

    const startsAt = parseIstanbulDateTime(eventForm.startsAt);
    if (
      eventForm.startsAt === "" ||
      !Number.isFinite(startsAt) ||
      startsAt < Date.now() - 60_000
    ) {
      errors.startsAt = "Geçerli ve gelecekte bir başlangıç zamanı seç.";
    }

    return errors;
  }

  async function handleCreateClub(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (creatingClub) return;

    const errors = validateClub();
    setClubErrors(errors);
    if (Object.keys(errors).length > 0) {
      setClubFormError("Lütfen işaretli alanları düzelt.");
      focusField(CLUB_FIELD_IDS, errors);
      return;
    }

    setCreatingClub(true);
    setClubFormError(null);
    try {
      const response = await createAdminClub(token, {
        name: clubForm.name.trim(),
        ...(clubForm.slug.trim() !== "" ? { slug: clubForm.slug.trim() } : {}),
        description: clubForm.description.trim(),
        category: clubForm.category,
        meetingNote: clubForm.meetingNote.trim(),
        contact: clubForm.contact.trim(),
      });
      toastSuccess(`“${response.club.name}” topluluğu eklendi.`);
      setClubForm(makeEmptyClub());
      setClubErrors({});
      await reload(token);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      if (error instanceof ApiError && error.field) {
        setClubErrors({ [error.field]: error.message });
        focusField(CLUB_FIELD_IDS, { [error.field]: error.message });
      } else {
        setClubFormError(messageOf(error));
      }
    } finally {
      setCreatingClub(false);
    }
  }

  async function handleCreateEvent(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (creatingEvent) return;

    const errors = validateEvent();
    setEventErrors(errors);
    if (Object.keys(errors).length > 0) {
      setEventFormError("Lütfen işaretli alanları düzelt.");
      focusField(EVENT_FIELD_IDS, errors);
      return;
    }

    setCreatingEvent(true);
    setEventFormError(null);
    try {
      const startsAt = parseIstanbulDateTime(eventForm.startsAt);
      const response = await createAdminEvent(token, {
        clubSlug: eventForm.clubSlug,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        startsAt,
        location: eventForm.location.trim(),
      });
      toastSuccess(`“${response.event.title}” etkinliği eklendi.`);
      setEventForm(makeEmptyEvent(data?.clubs[0]?.slug ?? ""));
      setEventErrors({});
      await reload(token);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      if (error instanceof ApiError && error.field) {
        setEventErrors({ [error.field]: error.message });
        focusField(EVENT_FIELD_IDS, { [error.field]: error.message });
      } else {
        setEventFormError(messageOf(error));
      }
    } finally {
      setCreatingEvent(false);
    }
  }

  async function togglePin(post: PostDto): Promise<void> {
    if (busyKey !== null) return;

    setBusyKey(`pin-${post.id}`);
    setActionError(null);
    try {
      await setPostPinned(token, post.id, !post.pinned);
      toastSuccess(post.pinned ? "Sabitleme kaldırıldı." : "Gönderi sabitlendi.");
      await reload(token);
    } catch (error) {
      if (!handleAuthFailure(error)) {
        setActionError(messageOf(error));
      }
    } finally {
      setBusyKey(null);
    }
  }

  function askDeletePost(post: PostDto): void {
    setDeleteError(null);
    setDeleteTarget({ kind: "post", id: post.id, label: post.title });
  }

  function askDeleteEvent(item: EventDto): void {
    setDeleteError(null);
    setDeleteTarget({ kind: "event", id: item.id, label: item.title });
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget || deletePending) return;

    setDeletePending(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === "post") {
        await deleteAdminPost(token, deleteTarget.id);
      } else {
        await deleteAdminEvent(token, deleteTarget.id);
      }
      toastSuccess(
        deleteTarget.kind === "post" ? "Gönderi silindi." : "Etkinlik silindi.",
      );
      setDeleteTarget(null);
      await reload(token);
    } catch (error) {
      if (handleAuthFailure(error)) {
        setDeleteTarget(null);
      } else {
        setDeleteError(messageOf(error));
      }
    } finally {
      setDeletePending(false);
    }
  }

  if (phase === "locked") {
    return (
      <section className="mt-8 max-w-md rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 sm:p-6">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--elevated)] text-[color:var(--muted)]">
          <Icon name="lock" size={20} />
        </span>
        <h2 className="mt-3 text-lg font-semibold text-[color:var(--text)]">
          Yönetim girişi
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
          Devam etmek için sunucudaki <code className="text-xs">ADMIN_TOKEN</code>{" "}
          değerini gir. Anahtar yalnızca bu sekmede, bellekte tutulur.
        </p>

        <form
          className="mt-5 space-y-4"
          noValidate
          onSubmit={(event) => {
            void handleUnlock(event);
          }}
        >
          <Input
            autoComplete="off"
            error={unlockError ?? undefined}
            hint="En az 16 karakterlik yönetici anahtarı."
            id="admin-token"
            label="Yönetici anahtarı"
            onChange={(event) => {
              setToken(event.target.value);
              setUnlockError(null);
            }}
            required
            type="password"
            value={token}
          />
          <Button className="w-full" loading={unlocking} type="submit">
            {unlocking ? "Kontrol ediliyor" : "Kilidi aç"}
          </Button>
        </form>
      </section>
    );
  }

  return (
    <div aria-busy={refreshing} className="mt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge tone="success">
            <Icon name="check" size={11} />
            Yönetici oturumu
          </Badge>
          <span className="text-xs text-[color:var(--muted)]">
            Pano yönetimi açık
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            loading={refreshing}
            onClick={() => {
              void reload(token);
            }}
            size="sm"
            variant="secondary"
          >
            Verileri yenile
          </Button>
          <Button onClick={lock} size="sm" variant="ghost">
            Kilitle
          </Button>
        </div>
      </div>

      {dataError ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-4 py-3 text-sm text-[color:var(--danger-text)]"
          role="alert"
        >
          <p>{dataError}</p>
          <Button
            loading={refreshing}
            onClick={() => {
              void reload(token);
            }}
            size="sm"
            variant="secondary"
          >
            Tekrar dene
          </Button>
        </div>
      ) : null}

      {data === null ? (
        <div
          aria-hidden="true"
          className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
        >
          <div className="h-4 w-40 animate-pulse rounded bg-[color:var(--elevated)]" />
          <div className="h-16 animate-pulse rounded bg-[color:var(--elevated)]" />
          <div className="h-16 animate-pulse rounded bg-[color:var(--elevated)]" />
          <p className="text-xs text-[color:var(--muted)]">Veriler yükleniyor…</p>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="admin-posts-title"
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                className="text-lg font-semibold text-[color:var(--text)]"
                id="admin-posts-title"
              >
                Gönderiler
              </h2>
              <p className="text-xs text-[color:var(--muted)]">
                {data.posts.length} / {data.total} gösteriliyor
              </p>
            </div>

            {actionError ? (
              <p
                className="mt-3 rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-3 py-2 text-sm text-[color:var(--danger-text)]"
                role="alert"
              >
                {actionError}
              </p>
            ) : null}

            {data.posts.length === 0 ? (
              <EmptyState
                className="mt-4"
                description="Pano henüz boş. Yeni bir gönderi oluşturulunca burada görünür."
                icon="pin"
                title="Gönderi yok"
              />
            ) : (
              <ul className="mt-3 divide-y divide-[color:var(--border)]">
                {data.posts.map((post) => {
                  const pinBusy = busyKey === `pin-${post.id}`;
                  return (
                    <li
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                      key={post.id}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge>{POST_CATEGORY_LABELS[post.category]}</Badge>
                          {post.pinned ? <Badge tone="brand">Sabit</Badge> : null}
                          <span className="text-xs text-[color:var(--muted)]">
                            {post.clubName ?? "Genel pano"}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm font-medium leading-6 text-[color:var(--text)]">
                          {post.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                          {post.authorName} · {formatDateTime(post.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          disabled={busyKey !== null && !pinBusy}
                          loading={pinBusy}
                          onClick={() => {
                            void togglePin(post);
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          {post.pinned ? "Sabitten kaldır" : "Sabitle"}
                        </Button>
                        <Button
                          disabled={busyKey !== null}
                          onClick={() => askDeletePost(post)}
                          size="sm"
                          variant="danger-ghost"
                        >
                          Sil
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section
              aria-labelledby="admin-club-title"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5"
            >
              <h2
                className="text-lg font-semibold text-[color:var(--text)]"
                id="admin-club-title"
              >
                Yeni topluluk
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Panoda ve topluluklar sayfasında hemen görünür.
              </p>

              <form
                className="mt-4 space-y-4"
                noValidate
                onSubmit={(event) => {
                  void handleCreateClub(event);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    error={clubErrors.name}
                    id="club-name"
                    label="Topluluk adı"
                    maxLength={60}
                    onChange={(event) => updateClub("name", event.target.value)}
                    required
                    value={clubForm.name}
                  />
                  <Input
                    error={clubErrors.slug}
                    hint="Boş bırakılırsa addan üretilir."
                    id="club-slug"
                    label="Adres (isteğe bağlı)"
                    maxLength={60}
                    onChange={(event) => updateClub("slug", event.target.value)}
                    placeholder="ornek-topluluk"
                    value={clubForm.slug}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    error={clubErrors.category}
                    id="club-category"
                    label="Kategori"
                    onChange={(event) =>
                      updateClub("category", event.target.value as ClubCategory)
                    }
                    required
                    value={clubForm.category}
                  >
                    {CLUB_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {CLUB_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </Select>
                  <Input
                    error={clubErrors.contact}
                    id="club-contact"
                    label="İletişim (isteğe bağlı)"
                    maxLength={120}
                    onChange={(event) =>
                      updateClub("contact", event.target.value)
                    }
                    placeholder="eposta@ornek.com"
                    value={clubForm.contact}
                  />
                </div>

                <Textarea
                  error={clubErrors.description}
                  id="club-description"
                  label="Açıklama"
                  maxLength={1200}
                  onChange={(event) =>
                    updateClub("description", event.target.value)
                  }
                  required
                  rows={4}
                  value={clubForm.description}
                />

                <Input
                  error={clubErrors.meetingNote}
                  hint="Örn. Her çarşamba 17.30 · Kütüphane"
                  id="club-meeting-note"
                  label="Buluşma notu (isteğe bağlı)"
                  maxLength={200}
                  onChange={(event) =>
                    updateClub("meetingNote", event.target.value)
                  }
                  value={clubForm.meetingNote}
                />

                {clubFormError ? (
                  <p
                    className="rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-3 py-2 text-sm text-[color:var(--danger-text)]"
                    role="alert"
                  >
                    {clubFormError}
                  </p>
                ) : null}

                <Button className="w-full" loading={creatingClub} type="submit">
                  {creatingClub ? "Ekleniyor" : "Topluluk ekle"}
                </Button>
              </form>
            </section>

            <section
              aria-labelledby="admin-event-title"
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5"
            >
              <h2
                className="text-lg font-semibold text-[color:var(--text)]"
                id="admin-event-title"
              >
                Yeni etkinlik
              </h2>
              <p className="mt-1 text-sm text-[color:var(--muted)]">
                Yaklaşan etkinlikler listesine eklenir.
              </p>

              <form
                className="mt-4 space-y-4"
                noValidate
                onSubmit={(event) => {
                  void handleCreateEvent(event);
                }}
              >
                <Select
                  error={eventErrors.clubSlug}
                  id="event-club"
                  label="Topluluk"
                  onChange={(event) =>
                    updateEvent("clubSlug", event.target.value)
                  }
                  required
                  value={eventForm.clubSlug}
                >
                  <option value="">Topluluk seç</option>
                  {data.clubs.map((club) => (
                    <option key={club.slug} value={club.slug}>
                      {club.name}
                    </option>
                  ))}
                </Select>

                <Input
                  error={eventErrors.title}
                  id="event-title"
                  label="Etkinlik adı"
                  maxLength={120}
                  onChange={(event) => updateEvent("title", event.target.value)}
                  required
                  value={eventForm.title}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    error={eventErrors.startsAt}
                    hint="Türkiye saatiyle."
                    id="event-starts-at"
                    label="Başlangıç"
                    onChange={(event) =>
                      updateEvent("startsAt", event.target.value)
                    }
                    required
                    type="datetime-local"
                    value={eventForm.startsAt}
                  />
                  <Input
                    error={eventErrors.location}
                    id="event-location"
                    label="Yer"
                    maxLength={120}
                    onChange={(event) =>
                      updateEvent("location", event.target.value)
                    }
                    required
                    value={eventForm.location}
                  />
                </div>

                <Textarea
                  error={eventErrors.description}
                  id="event-description"
                  label="Açıklama"
                  maxLength={800}
                  onChange={(event) =>
                    updateEvent("description", event.target.value)
                  }
                  required
                  rows={4}
                  value={eventForm.description}
                />

                {eventFormError ? (
                  <p
                    className="rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-3 py-2 text-sm text-[color:var(--danger-text)]"
                    role="alert"
                  >
                    {eventFormError}
                  </p>
                ) : null}

                <Button className="w-full" loading={creatingEvent} type="submit">
                  {creatingEvent ? "Ekleniyor" : "Etkinlik ekle"}
                </Button>
              </form>
            </section>
          </div>

          <section
            aria-labelledby="admin-events-title"
            className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                className="text-lg font-semibold text-[color:var(--text)]"
                id="admin-events-title"
              >
                Etkinlikler
              </h2>
              <p className="text-xs text-[color:var(--muted)]">
                {data.events.length} yaklaşan etkinlik
              </p>
            </div>

            {data.events.length === 0 ? (
              <EmptyState
                className="mt-4"
                description="Yaklaşan etkinlik yok. Yukarıdaki formdan yeni bir etkinlik ekleyebilirsin."
                icon="calendar"
                title="Etkinlik yok"
              />
            ) : (
              <ul className="mt-3 divide-y divide-[color:var(--border)]">
                {data.events.map((item) => (
                  <li
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-[color:var(--text)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--muted)]">
                        {item.clubName} · {formatDateTime(item.startsAt)} ·{" "}
                        {item.location}
                      </p>
                    </div>
                    <Button
                      disabled={busyKey !== null}
                      onClick={() => askDeleteEvent(item)}
                      size="sm"
                      variant="danger-ghost"
                    >
                      Sil
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        confirmLabel="Sil"
        description={
          deleteTarget
            ? `“${deleteTarget.label}” kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : ""
        }
        error={deleteError ?? undefined}
        onConfirm={() => {
          void confirmDelete();
        }}
        onOpenChange={(open) => {
          if (!open && !deletePending) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        open={deleteTarget !== null}
        pending={deletePending}
        title={
          deleteTarget?.kind === "event" ? "Etkinliği sil" : "Gönderiyi sil"
        }
      />
    </div>
  );
}
