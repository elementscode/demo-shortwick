import { LiveTable, Channel, session, sql, SqlError, ForbiddenError, ValidationError } from "@elements/app";

export interface Link {
  id: string;
  userId: string;
  slug: string;
  url: string;
  title: string;
  tags: string[];
  enabled: boolean;
  expiresAt: Date | null;
  clicks: number;
  lastClickedAt: Date | null;
  createdAt: Date;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  userId: string;
  createdAt: Date;
  referrer: string;
  country: string;
  device: string;
}

export const SLUG_PATTERN = "[A-Za-z0-9_-]{3,40}";

/** Paths the app itself answers, so no short link may take them. */
const RESERVED = new Set([
  "signin",
  "signup",
  "signout",
  "links",
  "api",
  "qr",
  "assets",
  "static",
  "admin",
  "new",
  "settings",
]);

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A six character back-half with the look-alike characters left out. */
export function randomSlug(): string {
  let bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join("");
}

export function slugError(slug: string): string | undefined {
  if (!new RegExp(`^${SLUG_PATTERN}$`).test(slug)) {
    return "use 3 to 40 letters, numbers, dashes or underscores";
  }

  if (RESERVED.has(slug.toLowerCase())) {
    return `"${slug}" is reserved`;
  }

  return undefined;
}

/** Adds https:// to a bare host and rejects anything that is not http(s). */
export function normalizeUrl(input: string): string | undefined {
  let text = input.trim();

  if (!text) {
    return undefined;
  }

  if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) {
    text = `https://${text}`;
  }

  try {
    let url = new URL(text);

    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname.includes(".")) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

/** "launch, Blog ,,blog" becomes ["launch", "blog"]. */
export function parseTags(input: string): string[] {
  let tags = input
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter((t) => t.length > 0 && t.length <= 24);

  return [...new Set(tags)].slice(0, 8);
}

export function isExpired(link: Link, now: Date = new Date()): boolean {
  return link.expiresAt !== null && +new Date(link.expiresAt) <= +now;
}

export type LinkStatus = "live" | "off" | "expired";

export function linkStatus(link: Link): LinkStatus {
  if (!link.enabled) {
    return "off";
  }

  if (isExpired(link)) {
    return "expired";
  }

  return "live";
}

function checkLink(item: Partial<Link>) {
  let errors: { url?: string[]; slug?: string[] } = {};

  let url = normalizeUrl(item.url ?? "");
  if (!url) {
    errors.url = ["enter a web address, like example.com/page"];
  }

  let slugProblem = slugError(item.slug ?? "");
  if (slugProblem) {
    errors.slug = [slugProblem];
  }

  if (errors.url || errors.slug) {
    throw new ValidationError(errors);
  }

  return url!;
}

function ownerOrThrow(userId: string | undefined) {
  if (!userId || userId !== session.getOrThrow("userId")) {
    throw new ForbiddenError();
  }
}

/**
 * One user's links, opened as view({ userId }). The channel is pinned so the
 * clicks trigger in the schema migration can publish the running count.
 */
export let links: LiveTable<Link> = new LiveTable<Link>({
  channel: (partition) => (partition ? `links:${partition}` : "links"),

  select: ({ userId }) => sql<Link>(`
    select id, userId, slug, url, title, tags, enabled, expiresAt, clicks, lastClickedAt, createdAt from links where userId = ${userId} order by createdAt desc
  `),

  insert: (item) => {
    ownerOrThrow(item.userId);
    let url = checkLink(item);

    try {
      return sql<Link>(`
        insert into links (id, userId, slug, url, title, tags, expiresAt)
             values (${item.id}, ${item.userId}, ${item.slug}, ${url}, ${item.title ?? ""}, ${item.tags ?? []}::text[], ${item.expiresAt ?? null})
          returning id, userId, slug, url, title, tags, enabled, expiresAt, clicks, lastClickedAt, createdAt
      `).firstOrThrow();
    } catch (err) {
      if (err instanceof SqlError) {
        throw new ValidationError({ slug: [`${item.slug} is taken, try another`] });
      }

      throw err;
    }
  },

  // Everything but clicks, which only the redirect writes: an edit carrying a
  // count read a moment ago would otherwise erase the clicks since.
  update: (item) => {
    ownerOrThrow(item.userId);
    let url = checkLink(item);

    return sql<Link>(`
      update links
         set url = ${url},
             title = ${item.title},
             tags = ${item.tags}::text[],
             enabled = ${item.enabled},
             expiresAt = ${item.expiresAt}
       where id = ${item.id}
         and userId = ${item.userId}
   returning id, userId, slug, url, title, tags, enabled, expiresAt, clicks, lastClickedAt, createdAt
    `).firstOrThrow("link not found");
  },

  delete: (item) => {
    ownerOrThrow(item.userId);
    sql(`delete from links where id = ${item.id} and userId = ${item.userId}`);
  },
});

/** Every click as it happens, for the analytics page of the link it hit. */
export const clickEvents = new Channel<ClickEvent>("clickEvents");
