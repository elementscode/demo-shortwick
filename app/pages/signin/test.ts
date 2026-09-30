import { test, equal } from "@elements/app";
import { DEMO_LOGINS } from "#app/shared/services/auth";

test("signin", () => {
  test("shows both seeded accounts", () => {
    equal(DEMO_LOGINS.map((l) => l.email), ["ada@shortwick.test", "grace@shortwick.test"]);
  });
});
