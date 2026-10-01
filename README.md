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

- **Live click counts.** Links are a LiveTable, one view per owner, and a trigger publishes each new count, so the dashboard's numbers climb as visitors click.

- **Links edited straight through the view.** The dashboard creates, edits, switches off and deletes links through the live view itself. The table checks the owner, validates the url and back-half, and reports a taken back-half on the form.

- **Redirects first, counting after.** A short link sends the visitor on their way, then stores the click and bumps the count in one transaction. Expired and switched-off links get their own page.

- **Analytics that update as clicks arrive.** Each click also goes out on a channel, and a link's analytics page adds it to the chart and the referrer, country and device lists over 7, 30 or 90 days.

- **QR codes.** Each link has a QR code served as a PNG, built with an npm package.

- **Data and sessions from SQL.** Migrations define the shortener and seed two users, twenty links and three months of clicks, and each owner signs in with a session.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 32 tests pass. Every page works on desktop and phone.

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
