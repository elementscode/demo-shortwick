import { test, assert, equal, session, sql, ForbiddenError, ValidationError } from "@elements/app";
import { links, normalizeUrl, parseTags, randomSlug, slugError, linkStatus, Link } from "./links";
import { makeUser } from "./test-helpers";

async function expectThrows(fn: () => unknown, type: Function) {
  let threw = false;

  try {
    await fn();
  } catch (err) {
    threw = true;
    assert(err instanceof type, `got ${err}`);
  }

  assert(threw, "expected a throw");
}

test("links", () => {
  test("normalizeUrl adds https and rejects other schemes", () => {
    equal(normalizeUrl("example.com/a"), "https://example.com/a");
    equal(normalizeUrl(" http://x.io "), "http://x.io/");
    equal(normalizeUrl("ftp://x.io"), undefined);
    equal(normalizeUrl("javascript:alert(1)"), undefined);
    equal(normalizeUrl("localhost"), undefined);
    equal(normalizeUrl(""), undefined);
  });

  test("slugError", () => {
    equal(slugError("launch-2026"), undefined);
    assert(slugError("ab") !== undefined, "too short");
    assert(slugError("has space") !== undefined, "space");
    assert(slugError("Signin") !== undefined, "reserved");
  });

  test("randomSlug is six safe characters", () => {
    let slug = randomSlug();
    equal(slug.length, 6);
    equal(slugError(slug), undefined);
  });

  test("parseTags trims, lowercases and dedupes", () => {
    equal(parseTags(" Launch, blog ,,BLOG, big news"), ["launch", "blog", "big-news"]);
  });

  test("linkStatus", () => {
    let base = { enabled: true, expiresAt: null } as Link;
    equal(linkStatus(base), "live");
    equal(linkStatus({ ...base, enabled: false }), "off");
    equal(linkStatus({ ...base, expiresAt: new Date(Date.now() - 1000) }), "expired");
  });

  test("insert writes a link for the signed-in owner", () => {
    let ada = makeUser("ada@test.dev");
    session.login({ userId: ada.id, userName: ada.name });

    let row = links.view({ userId: ada.id }).insert({ slug: "hello", url: "example.com", title: "Hi", tags: ["a"] });

    equal(row.url, "https://example.com/");
    equal(sql(`select count(*)::int as n from links where userId = ${ada.id}`).firstOrThrow().n, 1);
  });

  test("insert refuses someone else's partition", async () => {
    let ada = makeUser("ada@test.dev");
    let eve = makeUser("eve@test.dev");
    session.login({ userId: eve.id, userName: eve.name });

    await expectThrows(() => links.view({ userId: ada.id }).insert({ slug: "sneaky", url: "example.com" }), ForbiddenError);
  });

  test("insert refuses a taken slug with a field error", async () => {
    let ada = makeUser("ada@test.dev");
    let grace = makeUser("grace@test.dev");
    sql(`insert into links (userId, slug, url) values (${grace.id}, 'taken', 'https://a.io')`);
    session.login({ userId: ada.id, userName: ada.name });

    await expectThrows(() => links.view({ userId: ada.id }).insert({ slug: "taken", url: "b.io" }), ValidationError);
  });

  test("update keeps clicks that arrived after the row was read", () => {
    let ada = makeUser("ada@test.dev");
    session.login({ userId: ada.id, userName: ada.name });

    let view = links.view({ userId: ada.id });
    let row = view.insert({ slug: "counted", url: "example.com", title: "Counted", tags: [] });

    sql(`update links set clicks = 5 where id = ${row.id}`);
    view.update({ ...row, clicks: 0, enabled: false });

    let stored = sql<{ clicks: number; enabled: boolean }>(`select clicks, enabled from links where id = ${row.id}`).firstOrThrow();
    equal(stored.clicks, 5);
    equal(stored.enabled, false);
  });
});
