import { sql } from "@elements/app";
import { Fact } from "#app/shared/services/analytics";
import { ClickEvent } from "#app/shared/services/links";

/** Ninety days of clicks, pre-counted per UTC day and dimension. */
export function readFacts(linkId: string): Fact[] {
  return sql<Fact>(`
    with recent as (
      select to_char(createdAt at time zone 'UTC', 'YYYY-MM-DD') as day, referrer, country, device
        from clicks
       where linkId = ${linkId}
         and createdAt >= now() - interval '91 days'
    )
    select day, 'referrer' as kind, referrer as key, count(*)::int as n from recent group by day, referrer
    union all
    select day, 'country', country, count(*)::int from recent group by day, country
    union all
    select day, 'device', device, count(*)::int from recent group by day, device
  `).all();
}

export function readRecent(linkId: string, userId: string): ClickEvent[] {
  return sql<ClickEvent>(`
    select id, linkId, ${userId}::uuid as userId, createdAt, referrer, country, device
      from clicks
     where linkId = ${linkId}
     order by createdAt desc
     limit 12
  `).all();
}
