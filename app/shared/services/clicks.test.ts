import { test, equal, sql } from "@elements/app";
import { findTarget, recordClick } from "./clicks";
import { makeUser } from "./test-helpers";

test("clicks", () => {
  test("recordClick stores the click and bumps the count", () => {
    let ada = makeUser("ada@test.dev");
    sql(`insert into links (userId, slug, url) values (${ada.id}, 'go', 'https://example.com')`);

    let target = findTarget("go")!;
    let event = recordClick(target, { referrer: "x.com", country: "GB", device: "mobile" });
    recordClick(target, { referrer: "direct", country: "US", device: "desktop" });

    equal(event.linkId, target.id);
    equal(event.userId, ada.id);
    equal(event.country, "GB");

    let link = sql<{ clicks: number; lastClickedAt: Date | null }>(`select clicks, lastClickedAt from links where id = ${target.id}`).firstOrThrow();
    equal(link.clicks, 2);
    equal(link.lastClickedAt !== null, true);
    equal(sql(`select count(*)::int as n from clicks where linkId = ${target.id}`).firstOrThrow().n, 2);
  });

  test("findTarget is undefined for an unknown slug", () => {
    equal(findTarget("nothing-here"), undefined);
  });
});
