![Mail statistics](banner.svg)

# Mail statistics

How many e-mails your projects send – per day, per project, per sender and recipient. Data from the mail catcher.

An official [Hostwerk](https://github.com/Passimoritz/hostwerk-public) extension.

## Features

- Mails per day as a bar chart (7, 14 or 30 days)
- Top projects (sender domain), senders and recipients
- Totals: today, unread, average size
- Dashboard tile with today’s count

## Install

In Hostwerk: **Apps → Extensions → Marketplace** → “Mail statistics” → Install. Updates arrive automatically.

## Permissions

- Read captured e-mails (only date, sender, recipient, size – the page never shows contents)

Pages run isolated (own origin, no external scripts); anything that changes something asks you first.

## Development

```bash
node --test tests/*.test.js            # logic tests
node path/to/hostwerk-public/sdk/check.js . --strict   # same check as the catalog
```

The logic lives in `page/lib.js` (no DOM, tested), the page in `page/app.js`. A tag `vX.Y.Z` matching `manifest.json` publishes a release; the Hostwerk catalog picks it up.

Deutsch: [README.de.md](README.de.md) · License: MIT
