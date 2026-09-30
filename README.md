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
