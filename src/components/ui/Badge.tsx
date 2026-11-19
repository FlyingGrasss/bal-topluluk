import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "border-[color:var(--border)] bg-[color:var(--elevated)] text-[color:var(--text)]",
  brand:
    "border-[color:var(--brand-border)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]",
  success:
    "border-[color:var(--success-border)] bg-[color:var(--success-soft)] text-[color:var(--success)]",
  danger:
    "border-[color:var(--danger-border)] bg-[color:var(--danger-soft)] text-[color:var(--danger-text)]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
