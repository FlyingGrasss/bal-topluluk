import { cn } from "@/lib/cn";

export interface SpinnerProps {
  label?: string;
  size?: "sm" | "md";
}

export function Spinner({ label = "Yükleniyor", size = "md" }: SpinnerProps) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center" role="status">
      <span
        aria-hidden="true"
        className={cn(
          "animate-spin rounded-full border-2 border-current border-r-transparent",
          sizeClass,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
