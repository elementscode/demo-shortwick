import { ClickEvent } from "#app/shared/services/links";

export type Dimension = "referrer" | "country" | "device";

/** Clicks on one UTC day for one value of one dimension. */
export interface Fact {
  day: string;
  kind: Dimension;
  key: string;
  n: number;
}

export interface DayCount {
  id: string;
  day: string;
  n: number;
}

export interface Share {
  id: string;
  key: string;
  n: number;
  share: number;
}

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

const DAY_MS = 86400000;

export function dayKey(value: Date | string | number): string {
  return new Date(value).toISOString().slice(0, 10);
}

/** The last `range` UTC days, oldest first, ending today. */
export function days(range: number, now: number = Date.now()): string[] {
  return Array.from({ length: range }, (_, i) => dayKey(now - (range - 1 - i) * DAY_MS));
}

/** Every click has exactly one device, so device facts sum to the day's clicks. */
export function series(facts: Fact[], range: number, now: number = Date.now()): DayCount[] {
  let byDay = new Map<string, number>();

  for (let f of facts) {
    if (f.kind === "device") {
      byDay.set(f.day, (byDay.get(f.day) ?? 0) + f.n);
    }
  }

  return days(range, now).map((day) => ({ id: day, day, n: byDay.get(day) ?? 0 }));
}

export function top(facts: Fact[], kind: Dimension, range: number, limit: number = 8, now: number = Date.now()): Share[] {
  let since = days(range, now)[0];
  let counts = new Map<string, number>();
  let total = 0;

  for (let f of facts) {
    if (f.kind === kind && f.day >= since) {
      counts.set(f.key, (counts.get(f.key) ?? 0) + f.n);
      total += f.n;
    }
  }

  let rows = [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, n]) => ({ id: key, key, n, share: total ? n / total : 0 }));

  if (rows.length <= limit) {
    return rows;
  }

  let rest = rows.slice(limit - 1).reduce((sum, r) => sum + r.n, 0);

  return [...rows.slice(0, limit - 1), { id: "__other", key: "Other", n: rest, share: total ? rest / total : 0 }];
}

/** Folds a click that just happened into the facts the page already holds. */
export function addClick(facts: Fact[], click: ClickEvent) {
  let day = dayKey(click.createdAt);

  for (let kind of ["referrer", "country", "device"] as Dimension[]) {
    let key = click[kind];
    let fact = facts.find((f) => f.day === day && f.kind === kind && f.key === key);

    if (fact) {
      fact.n += 1;
    } else {
      facts.push({ day, kind, key, n: 1 });
    }
  }
}

/** An even axis top a little above the peak, so the midline is a whole number: 7 becomes 8, 22 becomes 24. */
export function niceMax(peak: number): number {
  for (let top of [4, 6, 8, 10]) {
    if (peak <= top) {
      return top;
    }
  }

  let magnitude = 10 ** Math.floor(Math.log10(peak));

  for (let step of [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10]) {
    if (step * magnitude >= peak) {
      return step * magnitude;
    }
  }

  return 10 * magnitude;
}

const REGIONS = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) {
    return code === "unknown" ? "Unknown" : code;
  }

  try {
    return REGIONS.of(code) ?? code;
  } catch {
    return code;
  }
}

export function flag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) {
    return "🌐";
  }

  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

export function referrerName(key: string): string {
  return key === "direct" ? "Direct, email or apps" : key;
}

export function deviceName(key: string): string {
  return key === "bot" ? "Bots and previews" : key[0].toUpperCase() + key.slice(1);
}
