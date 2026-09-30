import { test, equal } from "@elements/app";
import { Fact, addClick, days, niceMax, series, top } from "./analytics";

const NOW = Date.parse("2026-09-30T12:00:00Z");

const facts: Fact[] = [
  { day: "2026-09-30", kind: "device", key: "desktop", n: 3 },
  { day: "2026-09-30", kind: "device", key: "mobile", n: 1 },
  { day: "2026-09-28", kind: "device", key: "desktop", n: 2 },
  { day: "2026-08-01", kind: "device", key: "desktop", n: 9 },
  { day: "2026-09-30", kind: "referrer", key: "x.com", n: 4 },
  { day: "2026-09-28", kind: "referrer", key: "direct", n: 2 },
  { day: "2026-08-01", kind: "referrer", key: "google.com", n: 9 },
];

test("analytics", () => {
  test("days ends today and runs oldest first", () => {
    equal(days(3, NOW), ["2026-09-28", "2026-09-29", "2026-09-30"]);
  });

  test("series sums device facts per day and fills gaps with zero", () => {
    equal(series(facts, 3, NOW).map((d) => d.n), [2, 0, 4]);
  });

  test("top ranks within the range and computes shares", () => {
    let rows = top(facts, "referrer", 7, 8, NOW);
    equal(rows.map((r) => r.key), ["x.com", "direct"]);
    equal(rows[0].share, 4 / 6);
  });

  test("top folds the tail into Other", () => {
    let many: Fact[] = ["a", "b", "c", "d"].map((key, i) => ({ day: "2026-09-30", kind: "country", key, n: 10 - i }));
    let rows = top(many, "country", 7, 3, NOW);
    equal(rows.map((r) => [r.key, r.n]), [["a", 10], ["b", 9], ["Other", 15]]);
  });

  test("addClick bumps an existing fact or adds one", () => {
    let local: Fact[] = [{ day: "2026-09-30", kind: "device", key: "mobile", n: 1 }];
    addClick(local, {
      id: "c1",
      linkId: "l1",
      userId: "u1",
      createdAt: new Date(NOW),
      referrer: "reddit.com",
      country: "SE",
      device: "mobile",
    });

    equal(local.length, 3);
    equal(local[0].n, 2);
    equal(local.find((f) => f.kind === "country")?.key, "SE");
  });

  test("niceMax is even and at least the peak", () => {
    equal([0, 3, 7, 10, 11, 22, 43, 99, 130].map(niceMax), [4, 4, 8, 10, 12, 24, 50, 100, 160]);
  });
});
