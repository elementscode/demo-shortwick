import { test, equal, sql } from "@elements/app";
import { makeUser } from "#app/shared/services/test-helpers";
import { readFacts, readRecent } from "./services";

test("link analytics", () => {
  test("readFacts counts each dimension per day, and only the last 90 days", () => {
    let ada = makeUser("ada@test.dev");
    let link = sql<{ id: string }>(`insert into links (userId, slug, url) values (${ada.id}, 'abc', 'https://a.io') returning id`).firstOrThrow();

    sql(`
      insert into clicks (linkId, createdAt, referrer, country, device) values
        (${link.id}, now(), 'x.com', 'US', 'mobile'),
        (${link.id}, now(), 'x.com', 'GB', 'desktop'),
        (${link.id}, now() - interval '200 days', 'old.com', 'US', 'desktop')
    `);

    let facts = readFacts(link.id);
    let referrers = facts.filter((f) => f.kind === "referrer");

    equal(referrers.map((f) => [f.key, f.n]), [["x.com", 2]]);
    equal(facts.filter((f) => f.kind === "device").reduce((s, f) => s + f.n, 0), 2);
    equal(facts.filter((f) => f.kind === "country").length, 2);
  });

  test("readRecent is newest first and capped at twelve", () => {
    let ada = makeUser("ada@test.dev");
    let link = sql<{ id: string }>(`insert into links (userId, slug, url) values (${ada.id}, 'abc', 'https://a.io') returning id`).firstOrThrow();

    sql(`
      insert into clicks (linkId, createdAt)
        select ${link.id}, now() - make_interval(mins => g) from generate_series(1, 15) g
    `);

    let recent = readRecent(link.id, ada.id);
    equal(recent.length, 12);
    equal(+recent[0].createdAt > +recent[1].createdAt, true);
    equal(recent[0].userId, ada.id);
  });
});
