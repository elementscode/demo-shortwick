/** What a click records about who made it, read from the request headers. */
export interface Visitor {
  referrer: string;
  country: string;
  device: string;
}

type Headers = Record<string, string | string[] | undefined>;

function header(headers: Headers, name: string): string {
  let value = headers[name];

  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** The referring host without its www, or "direct" when there is none. */
export function referrerOf(referer: string, ownHost: string = ""): string {
  if (!referer) {
    return "direct";
  }

  try {
    let host = new URL(referer).hostname.replace(/^www\./, "").toLowerCase();

    if (!host || host === ownHost.replace(/^www\./, "").split(":")[0]) {
      return "direct";
    }

    return host;
  } catch {
    return "direct";
  }
}

export function deviceOf(userAgent: string): string {
  let ua = userAgent.toLowerCase();

  if (!ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|curl|wget|python-requests/.test(ua)) {
    return "bot";
  }

  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/.test(ua)) {
    return "tablet";
  }

  if (/mobi|iphone|ipod|android|phone/.test(ua)) {
    return "mobile";
  }

  return "desktop";
}

/**
 * A CDN in front of the app names the country in a header. Without one, the
 * region of the visitor's preferred language is the best guess available.
 */
export function countryOf(headers: Headers): string {
  for (let name of ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"]) {
    let code = header(headers, name).trim().toUpperCase();

    if (/^[A-Z]{2}$/.test(code) && code !== "XX") {
      return code;
    }
  }

  let language = header(headers, "accept-language").split(",")[0] ?? "";
  let region = language.split(/[-_]/)[1];

  if (region && /^[a-z]{2}$/i.test(region)) {
    return region.toUpperCase();
  }

  return "unknown";
}

export function visitorOf(headers: Headers): Visitor {
  return {
    referrer: referrerOf(header(headers, "referer"), header(headers, "host")),
    country: countryOf(headers),
    device: deviceOf(header(headers, "user-agent")),
  };
}
