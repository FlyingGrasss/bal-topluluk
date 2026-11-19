import { cn } from "@/lib/cn";

export function fieldClasses(hasError: boolean, className?: string): string {
  return cn(
    "w-full rounded-lg border bg-[color:var(--surface)] px-3 text-sm text-[color:var(--text)] outline-offset-2 transition-colors placeholder:text-[color:var(--muted)] disabled:cursor-not-allowed disabled:opacity-60",
    hasError
      ? "border-[color:var(--danger)]"
      : "border-[color:var(--border)] hover:border-[color:var(--border-strong)] focus:border-[color:var(--accent)]",
    className,
  );
}

export function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      className="mb-1.5 block text-sm font-medium text-[color:var(--text)]"
      htmlFor={htmlFor}
    >
      {label}
      {required ? (
        <>
          <span aria-hidden="true" className="ml-0.5 text-[color:var(--danger-text)]">
            *
          </span>
          <span className="sr-only"> (zorunlu)</span>
        </>
      ) : null}
    </label>
  );
}

export function FieldMessages({
  id,
  hint,
  error,
}: {
  id: string;
  hint?: string;
  error?: string;
}) {
  return (
    <>
      {hint && !error ? (
        <p className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-1.5 text-xs leading-5 text-[color:var(--danger-text)]"
          id={`${id}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}

export function describedBy(
  id: string,
  hint: string | undefined,
  error: string | undefined,
  extra?: string,
): string | undefined {
  const values = [
    extra,
    hint && !error ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean);
  return values.length > 0 ? values.join(" ") : undefined;
}
