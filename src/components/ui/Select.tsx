import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FieldLabel, FieldMessages, describedBy, fieldClasses } from "./field";

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      id,
      label,
      hint,
      error,
      containerClassName,
      className,
      required,
      children,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const described = describedBy(id, hint, error, ariaDescribedBy);

    return (
      <div className={containerClassName}>
        <FieldLabel htmlFor={id} label={label} required={required} />
        <div className="relative">
          <select
            ref={ref}
            aria-describedby={described}
            aria-invalid={error ? true : undefined}
            className={cn(
              fieldClasses(Boolean(error), "h-10 appearance-none pr-9"),
              className,
            )}
            id={id}
            required={required}
            {...props}
          >
            {children}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <FieldMessages error={error} hint={hint} id={id} />
      </div>
    );
  },
);
