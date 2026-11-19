const TIME_ZONE = "Europe/Istanbul";

const countFormatter = new Intl.NumberFormat("tr-TR");
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  weekday: "short",
});
const dayFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  day: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TIME_ZONE,
  month: "short",
});
const relativeFormatter = new Intl.RelativeTimeFormat("tr", {
  numeric: "auto",
});

export function formatCount(value: number): string {
  return countFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(timestamp: number): string {
  return dateFormatter.format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return dateTimeFormatter.format(new Date(timestamp));
}

export function formatTime(timestamp: number): string {
  return timeFormatter.format(new Date(timestamp));
}

export interface EventDayParts {
  weekday: string;
  day: string;
  month: string;
}

export function formatEventDay(timestamp: number): EventDayParts {
  const date = new Date(timestamp);
  return {
    weekday: weekdayFormatter.format(date),
    day: dayFormatter.format(date),
    month: monthFormatter.format(date),
  };
}

export function formatRelative(timestamp: number, now = Date.now()): string {
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const absolute = Math.abs(diffSeconds);

  if (absolute < 60) return "az önce";
  if (absolute < 60 * 60) {
    return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  }
  if (absolute < 24 * 60 * 60) {
    return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  }
  if (absolute < 30 * 24 * 60 * 60) {
    return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
  }
  return formatDate(timestamp);
}

export function formatRetryAfter(retryAfterMs: number): string {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (seconds < 60) return `${seconds} saniye sonra tekrar dene.`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} dakika sonra tekrar dene.`;
}
