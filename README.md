![Mail statistics](banner.svg)

# Mail statistics

How many e-mails your projects send – per day, per project, per sender and recipient. Data from the mail catcher.

An official [Hostwerk](https://github.com/Passimoritz/hostwerk-public) extension.

## Features

- **Where:** E-mail → Statistics – no own sidebar entry since 1.3.1; the full page stays under Extensions → Open
- Mails per day as a bar chart (7, 14 or 30 days)
- Top projects (sender domain), senders and recipients
- Totals: today, unread, with attachment, average size
- Click a project, sender, recipient or day to filter the whole page (click again to clear)
- Warns when far more mails go out than usual – e.g. a project sending in a loop
- Also a “Statistics” tab in Hostwerk’s mail area; the page sits next to *Mail* in the sidebar
- Dashboard tile with today’s count
- Bars usable with the keyboard and named for screen readers; dates and numbers in Hostwerk’s language
- Loading errors show a message with *Try again*; nothing is fetched while the page is hidden
- Other extensions may add tabs (`allowExtensions`)

## Install

In Hostwerk: **Extensions → Discover** → “Mail statistics” → Install. Updates arrive automatically.

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
