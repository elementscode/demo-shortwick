import { Request } from "@elements/app";

/** The scheme and host a visitor reached the app on, for building short urls. */
export function originOf(req: Request): string {
  let proto = String(req.headers["x-forwarded-proto"] ?? "http").split(",")[0].trim();
  let host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost");

  return `${proto}://${host}`;
}
