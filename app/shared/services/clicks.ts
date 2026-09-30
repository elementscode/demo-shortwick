import { sql, tx } from "@elements/app";
import { clickEvents, ClickEvent } from "#app/shared/services/links";
import { Visitor } from "#app/shared/services/visitor";

export interface Target {
  id: string;
  userId: string;
  url: string;
  enabled: boolean;
  expiresAt: Date | null;
}

export function findTarget(slug: string): Target | undefined {
  return sql<Target>(`
    select id, userId, url, enabled, expiresAt from links where slug = ${slug}
  `).first();
}

/**
 * Stores the click and bumps the link's count in one transaction. The count's
 * trigger updates the owner's dashboard; the event feeds the analytics page.
 */
export function recordClick(target: Target, visitor: Visitor): ClickEvent {
  let event = tx(() => {
    let row = sql<ClickEvent>(`
      insert into clicks (linkId, referrer, country, device)
           values (${target.id}, ${visitor.referrer}, ${visitor.country}, ${visitor.device})
        returning id, linkId, createdAt, referrer, country, device
    `).firstOrThrow();

    sql(`update links set clicks = clicks + 1, lastClickedAt = now() where id = ${target.id}`);

    return { ...row, userId: target.userId };
  });

  clickEvents.notify(event);

  return event;
}
