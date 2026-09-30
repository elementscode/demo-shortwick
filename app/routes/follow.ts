import { Request, Response, redirect } from "@elements/app";
import { findTarget, recordClick } from "#app/shared/services/clicks";
import { visitorOf } from "#app/shared/services/visitor";
import gone from "#app/pages/gone/template";

export default function follow(req: Request, res: Response) {
  let target = findTarget(req.params.slug);

  if (!target) {
    res.status(404);
    return new gone({ reason: "missing" });
  }

  if (!target.enabled) {
    res.status(410);
    return new gone({ reason: "off" });
  }

  if (target.expiresAt && +target.expiresAt <= Date.now()) {
    res.status(410);
    return new gone({ reason: "expired" });
  }

  // Every visit has to reach the server to be counted.
  res.setHeader("Cache-Control", "private, no-store");

  // The visitor is on their way before the click is written.
  redirect(target.url);

  recordClick(target, visitorOf(req.headers));
}
