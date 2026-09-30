const NUMBER = new Intl.NumberFormat("en-US");

export function formatCount(n: number): string {
  return NUMBER.format(n);
}

export function compactCount(n: number): string {
  if (n < 10000) {
    return NUMBER.format(n);
  }

  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** example.com/some/page, without the scheme, the www, or a trailing slash. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** A default title for a link nobody named: its host and the last path segment. */
export function titleFor(url: string): string {
  try {
    let u = new URL(url);
    let last = u.pathname.split("/").filter(Boolean).pop();
    let host = u.hostname.replace(/^www\./, "");

    return last ? `${host} / ${decodeURIComponent(last)}` : host;
  } catch {
    return url;
  }
}

export function shortDate(value: Date | string | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(value: Date | string | null, now: number = Date.now()): string {
  if (!value) {
    return "never";
  }

  let seconds = Math.max(0, Math.round((now - +new Date(value)) / 1000));

  if (seconds < 45) {
    return "just now";
  }

  let minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  let hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  let days = Math.round(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  return shortDate(value);
}

/** "2026-10-12" for a date input, in the viewer's own calendar. */
export function dateInputValue(value: Date | string | null): string {
  if (!value) {
    return "";
  }

  let d = new Date(value);
  let month = String(d.getMonth() + 1).padStart(2, "0");
  let day = String(d.getDate()).padStart(2, "0");

  return `${d.getFullYear()}-${month}-${day}`;
}

/** The end of the chosen day, in the viewer's own time zone. */
export function endOfDay(input: string): Date | null {
  if (!input) {
    return null;
  }

  return new Date(`${input}T23:59:59`);
}
