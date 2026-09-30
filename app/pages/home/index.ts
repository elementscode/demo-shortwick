import { Request, Response, redirect, session } from "@elements/app";
import { links } from "#app/shared/services/links";
import { originOf } from "#app/shared/services/origin";
import html from "./template";

export default function route(req: Request, res: Response) {
  if (!session.isLoggedIn()) {
    redirect("/signin");
    return;
  }

  return new html({
    links: links.view({ userId: session.getOrThrow("userId") }),
    origin: originOf(req),
  });
}
