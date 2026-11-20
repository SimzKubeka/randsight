# Verification

How RandSight is checked, and what the latest run showed.

## Commands

```
npm run typecheck    # TypeScript, strict
npm run lint         # ESLint
npm test             # unit tests (Vitest)
npm run test:e2e     # browser tests (Playwright) against a production build on port 3100
```

The browser tests build the app, start the same standalone server Docker runs, and use their own database file. They run every test twice: at phone size (360 × 740) and desktop size (1280 × 800).

Setting `BASE_URL` points the browser tests at a server that is already running instead. CI uses this to sign in and use the dashboard against the Docker image, so the container's own seeded database is tested, not just the build.

## Continuous integration

GitHub Actions runs three jobs on every pull request and every push to `main`:

1. Type check, lint and unit tests.
2. Production build and every browser test.
3. Docker build, then the dashboard browser tests against the running container.

## What is covered

### Financial correctness

- The October reconciliation: R600 less income + R1,200 more medical + R900 more groceries = R2,700 less left over, both from hand-made numbers and from the seeded database.
- The brief's exact sentences for October.
- Drivers always add up to the change in money left over, checked across 200 generated months as well as the fixture.
- Refunds come off their category in the month they post, including a category where refunds exceed spending.
- Transfers are excluded from money in, money out and every insight.
- Month boundaries in South African time: 23:30 on 31 October is October; 00:30 on 1 November is November; the year boundary.
- Empty months, a missing previous month, and categories with nothing the month before.
- Paging the 50,000-transaction customer: every row appears exactly once, in a stable order, and the rows add up to the category total.

### Customer experience and accessibility

- Landing → sign-in → October explanation → Medical payments → back to the same row → sign-out.
- A bookmarked Medical view survives sign-in, refresh and the browser's Back button.
- Opening a category moves focus to its heading. "All of October" and Back return focus to the row that was opened.
- Keyboard-only sign-in and drill-down.
- No horizontal scrolling at phone width.
- Expired sessions return to sign-in with a message, then back to the page.
- axe finds no violations on any public or private page, including the sign-in errors.

### Privacy and security

- One customer's queries never return another customer's payments.
- Session tokens are stored only as hashes; expired sessions are refused and removed.
- `next` cannot redirect off the dashboard (`//evil.example` is ignored).
- Private pages send `Cache-Control: no-store` and `noindex`, are left out of the sitemap, and are disallowed in `robots.txt`.
- Public page metadata contains no amounts.

## Latest results

Run on 20 November 2026 (Windows 11, Node 24.18).

| Check | Result |
|---|---|
| Type check | Pass |
| Lint | Pass, 0 problems |
| Unit tests | 73 passed |
| Browser tests | 48 passed |
| Docker image, built from a clean clone | Built in 58 s, 392 MB |
| Dashboard browser tests against the container | 14 passed |

## Still to record

Before submission, this page will add:

- Lighthouse results (median of three cold mobile runs) for the landing page and the signed-in dashboard, against the production container.
- Scale results for the 50,000-transaction customer: filtering and paging times, and a concurrent-read test with separate sessions (machine, concurrency, duration, throughput, p95 latency, errors).

See also: [Architecture](architecture.md) · [Tech stack](tech-stack.md)
