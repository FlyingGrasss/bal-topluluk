"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AUTHOR_NAME_MAX_LENGTH,
  AUTHOR_NAME_MIN_LENGTH,
  POST_BODY_MAX_LENGTH,
  POST_BODY_MIN_LENGTH,
  POST_CATEGORIES,
  POST_TITLE_MAX_LENGTH,
  POST_TITLE_MIN_LENGTH,
} from "@shared/constants";
import type { ClubDto, PostCategory } from "@shared/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toastSuccess } from "@/components/ui/Toaster";
import { ApiError, submitPost } from "@/lib/api";
import { formatRetryAfter } from "@/lib/format";
import { POST_CATEGORY_LABELS } from "@/lib/labels";

function charLength(value: string): number {
  return Array.from(value).length;
}

export function NewPostForm({
  clubs,
  initialClubSlug = "",
  defaultCategory = "genel",
}: {
  clubs: ClubDto[];
  initialClubSlug?: string;
  defaultCategory?: PostCategory;
}) {
  const router = useRouter();
  const authorRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<PostCategory>(defaultCategory);
  const [clubSlug, setClubSlug] = useState(
    clubs.some((club) => club.slug === initialClubSlug) ? initialClubSlug : "",
  );
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function clearFieldError(field: string): void {
    setFieldErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError(null);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    let firstInvalid: HTMLElement | null = null;

    if (charLength(authorName.trim()) < AUTHOR_NAME_MIN_LENGTH) {
      errors.authorName = `Adın en az ${AUTHOR_NAME_MIN_LENGTH} karakter olmalı.`;
      firstInvalid = authorRef.current;
    } else if (charLength(authorName.trim()) > AUTHOR_NAME_MAX_LENGTH) {
      errors.authorName = `Adın en fazla ${AUTHOR_NAME_MAX_LENGTH} karakter olabilir.`;
      firstInvalid = authorRef.current;
    }

    if (charLength(title.trim()) < POST_TITLE_MIN_LENGTH) {
      errors.title = `Başlık en az ${POST_TITLE_MIN_LENGTH} karakter olmalı.`;
      firstInvalid ??= titleRef.current;
    } else if (charLength(title.trim()) > POST_TITLE_MAX_LENGTH) {
      errors.title = `Başlık en fazla ${POST_TITLE_MAX_LENGTH} karakter olabilir.`;
      firstInvalid ??= titleRef.current;
    }

    if (charLength(body.trim()) < POST_BODY_MIN_LENGTH) {
      errors.body = `Mesaj en az ${POST_BODY_MIN_LENGTH} karakter olmalı.`;
      firstInvalid ??= bodyRef.current;
    } else if (charLength(body.trim()) > POST_BODY_MAX_LENGTH) {
      errors.body = `Mesaj en fazla ${POST_BODY_MAX_LENGTH} karakter olabilir.`;
      firstInvalid ??= bodyRef.current;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Lütfen işaretli alanları düzelt.");
      firstInvalid?.focus();
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (pending) return;

    setFormError(null);

    if (website.trim() !== "") {
      // Honeypot: bots get a success-shaped no-op and no database write.
      toastSuccess("Gönderin panoya eklendi.");
      setTitle("");
      setBody("");
      setWebsite("");
      return;
    }

    if (!validate()) return;

    setPending(true);
    try {
      await submitPost({
        authorName: authorName.trim(),
        title: title.trim(),
        body: body.trim(),
        category,
        clubSlug: clubSlug || null,
      });

      toastSuccess("Gönderin panoya eklendi.");
      setFieldErrors({});
      setTitle("");
      setBody("");
      setCategory(defaultCategory);
      setWebsite("");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.field) {
          setFieldErrors({ [error.field]: error.message });
        } else {
          const retry =
            error.retryAfterMs !== undefined
              ? ` ${formatRetryAfter(error.retryAfterMs)}`
              : "";
          setFormError(`${error.message}${retry}`);
        }
      } else {
        setFormError("Gönderi eklenemedi. Lütfen tekrar dene.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div>
        <h2 className="text-base font-semibold text-[color:var(--text)]">
          Panoya bir şey bırak
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
          Duyuru, etkinlik, soru ya da kısa bir not. Kayıt gerekmez.
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted)]">
          <span aria-hidden="true" className="text-[color:var(--danger-text)]">
            *
          </span>{" "}
          işaretli alanlar zorunlu.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="post-website">Web sitesi</label>
        <input
          autoComplete="off"
          id="post-website"
          name="website"
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          type="text"
          value={website}
        />
      </div>

      <Input
        ref={authorRef}
        autoComplete="name"
        error={fieldErrors.authorName}
        id="post-author"
        label="Adın"
        maxLength={AUTHOR_NAME_MAX_LENGTH}
        onChange={(event) => {
          setAuthorName(event.target.value);
          clearFieldError("authorName");
        }}
        placeholder="Örn. Elif K."
        required
        value={authorName}
      />

      <Input
        ref={titleRef}
        error={fieldErrors.title}
        id="post-title"
        label="Başlık"
        maxLength={POST_TITLE_MAX_LENGTH}
        onChange={(event) => {
          setTitle(event.target.value);
          clearFieldError("title");
        }}
        placeholder="Kısa ve açık bir başlık"
        required
        value={title}
      />

      <Textarea
        ref={bodyRef}
        error={fieldErrors.body}
        hint={`${charLength(body)} / ${POST_BODY_MAX_LENGTH} karakter`}
        id="post-body"
        label="Mesajın"
        maxLength={POST_BODY_MAX_LENGTH}
        onChange={(event) => {
          setBody(event.target.value);
          clearFieldError("body");
        }}
        placeholder="Ne paylaşmak istiyorsun?"
        required
        value={body}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="post-category"
          label="Kategori"
          onChange={(event) => {
            setCategory(event.target.value as PostCategory);
            clearFieldError("category");
          }}
          required
          value={category}
        >
          {POST_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {POST_CATEGORY_LABELS[option]}
            </option>
          ))}
        </Select>

        <Select
          error={fieldErrors.clubSlug}
          hint={clubs.length === 0 ? "Topluluk listesi şu anda yüklenemedi." : undefined}
          id="post-club"
          label="Topluluk (isteğe bağlı)"
          onChange={(event) => {
            setClubSlug(event.target.value);
            clearFieldError("clubSlug");
          }}
          value={clubSlug}
        >
          <option value="">Genel pano</option>
          {clubs.map((club) => (
            <option key={club.slug} value={club.slug}>
              {club.name}
            </option>
          ))}
        </Select>
      </div>

      {formError ? (
        <p
          className="rounded-lg border border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] px-3 py-2 text-sm leading-6 text-[color:var(--danger-text)]"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <Button className="w-full" loading={pending} type="submit">
        {pending ? "Gönderiliyor" : "Panoya gönder"}
      </Button>
    </form>
  );
}
