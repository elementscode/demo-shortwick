![A URL shortener with click analytics, built by Claude Code on Elements: a short link's analytics page with its live status, all-time clicks and a 90-day clicks chart with a launch-day spike.](https://elements.dev/demos/01a0f42d-7038-7412-a214-9445b53b37d5/poster?v=f8193d4ca9b4)

# A URL shortener with click analytics, built by Claude Code on Elements

> Shortwick is a full-stack app built with Claude Code on Elements.

Short links with custom back-halves and expiry dates, instant redirects, live click counts, referrer, country and device breakdowns, tags, search and QR codes.

[Run this app on your machine](https://elements.dev/demos/01a0f42d-7038-7412-a214-9445b53b37d5). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Shortwick needed short links that redirect at once, a click count that climbs while the owner watches, breakdowns by referrer, country and device, QR codes and accounts. Each of those is a part of Elements, so the agent spent its 18 minutes on the shortener itself.

- **Live click counts.** Links are a LiveTable, one view per owner, and a trigger publishes each new count, so the dashboard's numbers climb as visitors click.

- **Links edited straight through the view.** The dashboard creates, edits, switches off and deletes links through the live view itself. The table checks the owner, validates the url and back-half, and reports a taken back-half on the form.

- **Redirects first, counting after.** A short link sends the visitor on their way, then stores the click and bumps the count in one transaction. Expired and switched-off links get their own page.

- **Analytics that update as clicks arrive.** Each click also goes out on a channel, and a link's analytics page adds it to the chart and the referrer, country and device lists over 7, 30 or 90 days.

- **QR codes.** Each link has a QR code served as a PNG, built with an npm package.

- **Data and sessions from SQL.** Migrations define the shortener and seed two users, twenty links and three months of clicks, and each owner signs in with a session.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
