import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldLabel, FieldMessages, describedBy, fieldClasses } from "./field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  endAdornment?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    endAdornment,
    containerClassName,
    className,
    required,
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
        <input
          ref={ref}
          aria-describedby={described}
          aria-invalid={error ? true : undefined}
          className={fieldClasses(Boolean(error), `h-10 ${endAdornment ? "pr-12" : ""} ${className ?? ""}`)}
          id={id}
          required={required}
          {...props}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            {endAdornment}
          </div>
        ) : null}
      </div>
      <FieldMessages error={error} hint={hint} id={id} />
    </div>
  );
});
