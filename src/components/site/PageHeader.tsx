import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[color:var(--text)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link className={buttonClasses("secondary", "md")} href={action.href}>
          {action.label}
          <Icon name="arrow-right" size={15} />
        </Link>
      ) : null}
    </div>
  );
}
