import { test, equal, session, sql } from "@elements/app";
import { links } from "#app/shared/services/links";
import { makeUser } from "#app/shared/services/test-helpers";

test("home", () => {
  test("a user's view holds only their own links, newest first", () => {
    let ada = makeUser("ada@test.dev");
    let grace = makeUser("grace@test.dev");

    sql(`
      insert into links (userId, slug, url, createdAt) values
        (${ada.id}, 'older', 'https://a.io', now() - interval '2 days'),
        (${ada.id}, 'newer', 'https://b.io', now()),
        (${grace.id}, 'hers', 'https://c.io', now())
    `);

    session.login({ userId: ada.id, userName: ada.name });
    let view = links.view({ userId: ada.id });

    equal(view.map((l) => l.slug), ["newer", "older"]);
  });
});
