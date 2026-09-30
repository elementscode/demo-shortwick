import { Request, Response, NotFoundError, redirect, session, sql } from "@elements/app";
import { links, clickEvents } from "#app/shared/services/links";
import { originOf } from "#app/shared/services/origin";
import { qrSvg } from "#app/shared/services/qr";
import { readFacts, readRecent } from "./services";
import html from "./template";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  let userId = session.getOrThrow("userId");
  let linkId = req.params.id;

  let owned = UUID.test(linkId)
    ? sql<{ slug: string }>(`select slug from links where id = ${linkId} and userId = ${userId}`).first()
    : undefined;

  if (!owned) {
    throw new NotFoundError("link not found");
  }

  // Listen before reading, so a click between the two is not lost.
  let clicks = clickEvents.listen({ filter: (click) => click.linkId === linkId });
  let origin = originOf(req);

  return new html({
    links: links.view({ userId }),
    linkId,
    clicks,
    facts: readFacts(linkId),
    recent: readRecent(linkId, userId),
    origin,
    qr: qrSvg(`${origin}/${owned.slug}`, 220),
  });
}
