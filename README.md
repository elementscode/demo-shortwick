![Shortwick, a URL shortener built with Elements: a short link's analytics page with its live status, all-time clicks and a 90-day clicks chart with a launch-day spike.](https://elements.dev/demos/01a0f42d-7038-7412-a214-9445b53b37d5/poster?v=f8193d4ca9b4)

# Shortwick

> A demo app built with [Elements](https://elements.dev).

Short links with custom back-halves and expiry dates, instant redirects, live click counts, referrer, country and device breakdowns, tags, search and QR codes.

**Demo:** [Shortwick](https://elements.dev/demos/01a0f42d-7038-7412-a214-9445b53b37d5)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 18 min
- **Cost:** $5.13 at API rates, September 2026

## Get started

```bash
elements create shortwick -scaffold=elementscode/demo-shortwick
```

## How it's built

Shortwick needed short links that redirect at once, a click count that climbs while the owner watches, breakdowns by referrer, country and device, QR codes and accounts. Each of those is a part of Elements, so the agent spent its 18 minutes on the shortener itself.

### What Elements gave the app

- **Live click counts.** `links` is a LiveTable in `app/shared/services/links.ts`, one view per owner. A trigger in the schema migration publishes each new count, so the dashboard's numbers climb as visitors click.
- **Links edited straight through the view.** The dashboard and link pages call `links.insert`, `links.update` and `links.delete` on the view itself. The table's own handlers check the owner, validate the url and back-half, report a taken slug as a field error, and leave the click count to the redirect.
- **Redirects first, counting after.** `app/routes/follow.ts` sends the visitor on their way, then `recordClick` in `app/shared/services/clicks.ts` stores the click and bumps the count in one transaction. Expired and switched-off links get their own page.
- **Analytics that update as clicks arrive.** `recordClick` also sends each click on the `clickEvents` channel, and a link's analytics page listens for its own clicks and adds each one to the chart and the referrer, country and device lists over 7, 30 or 90 days.
- **QR codes from a package.** `app/shared/services/qr.ts` builds the code with an npm package, and `/links/:id/qr.png` serves it as a PNG.
- **Data from SQL files.** Two migrations define the shortener and seed two users, twenty links and three months of clicks.

### What the agent got from the tooling

The agent ran 20 builds in 18 minutes. By the build's own timer, the median build finished in 60 milliseconds, so it checked its work after each edit and kept going. The build caught three calls in `app/routes/follow.ts` that passed an argument to a function that takes none, each with the file and line. The agent read 48 manual pages as it reached each part, from `livetable/mutations` and `recipes/live-from-sql` to `packages`, then wrote 32 tests and checked its pages at phone width in a real browser.

Start in `app/shared/services/links.ts`.

## Seed data and demo accounts

The seed creates twenty links across two accounts with three months of click
history (about 2,200 clicks): weekly rhythms, a few launch-day spikes, one
expired link and two switched off. Destinations and referrers use fictional
`.example` domains. Both accounts' password is `shortwick-demo`, and the
sign-in page lists them.

| Email                  | Links |
| ---------------------- | ----- |
| ada@shortwick.test     | 12    |
| grace@shortwick.test   | 8     |

Country comes from a CDN country header (`cf-ipcountry` and similar) when one
is present, and otherwise from the region in the visitor's language setting.

## The prompt

```text
Build a URL shortener named shortwick with click analytics.

- Accounts. Shorten a url, with an optional custom back-half and expiry date.
- Short links redirect instantly.
- Each link's analytics: clicks over time, top referrers, countries, and
  devices.
- Tag links, search them, and turn a link off.
- A QR code for each link, downloadable as PNG.

Seed two users with twenty links and three months of click history. Show the
seeded logins on the sign-in page.

Click counts update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
