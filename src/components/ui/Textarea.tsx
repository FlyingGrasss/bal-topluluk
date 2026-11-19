import { forwardRef, type TextareaHTMLAttributes } from "react";
import { FieldLabel, FieldMessages, describedBy, fieldClasses } from "./field";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      id,
      label,
      hint,
      error,
      containerClassName,
      className,
      required,
      rows = 5,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const described = describedBy(id, hint, error, ariaDescribedBy);

    return (
      <div className={containerClassName}>
        <FieldLabel htmlFor={id} label={label} required={required} />
        <textarea
          ref={ref}
          aria-describedby={described}
          aria-invalid={error ? true : undefined}
          className={cn(fieldClasses(Boolean(error), "min-h-[7rem] py-2.5"), className)}
          id={id}
          required={required}
          rows={rows}
          {...props}
        />
        <FieldMessages error={error} hint={hint} id={id} />
      </div>
    );
  },
);
