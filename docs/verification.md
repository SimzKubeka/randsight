# Verification

How RandSight is checked, and what the latest run showed.

## Commands

```
npm run typecheck    # TypeScript, strict
npm run lint         # ESLint
npm test             # unit tests (Vitest)
npm run test:e2e     # browser tests (Playwright) against a production build on port 3100
npm run bench        # 50,000-payment scale and concurrency test (needs npm run build first)
npm run lighthouse   # Lighthouse against a running server, default http://localhost:3000 (BASE_URL to change)
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
- In the browser, a second customer opening Thandi's exact Medical link sees only their own payment, with none of her merchants, totals or name.
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
| Browser tests | 52 passed |
| Docker image, built from a clean clone | Built in 58 s, 392 MB |
| Dashboard browser tests against the container | 14 passed |

## Performance

Lighthouse 13.6, mobile preset with simulated throttling, against the production Docker container. Three cold runs per page, each in a fresh browser profile; the dashboard is loaded signed in. Medians:

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Transferred |
|---|---|---|---|---|---|---|---|---|---|
| Landing | 87 | 100 | 100 | 100 | 0.9 s | 0.9 s | 534 ms | 0 | 283 KB |
| Dashboard, October | 83 | 100 | 100 | 63 | 0.9 s | 0.9 s | 700 ms | 0 | 245 KB |

- Accessibility meets its target of 95. Performance is below its target of 90.
- Paint is fast and nothing shifts. The gap is Total Blocking Time: most of the script work is React starting up (`react-dom`, 71 KB compressed, the runtime every App Router page ships), multiplied by Lighthouse's 4× CPU slowdown. On the landing page, the scroll-driven effects add style and layout work.
- Dashboard SEO is 63 on purpose: private pages are `noindex`, and Lighthouse counts that against the score.
- Runs varied little: landing TBT 495–583 ms, dashboard 508–703 ms.

## Scale

`npm run bench` seeds a fresh database with the 50,000-payment test customer (fixed random seed), times the queries the dashboard runs, then starts the production server and loads it with `autocannon`. Each connection is a different signed-in session, alternating the October review and the last page of October groceries.

Machine: Intel Core i7-14700HX (28 threads), 32 GB, Windows 11, Node 24.18.

| Query (500 runs) | Median | p95 |
|---|---|---|
| Six-month totals (review page) | 1.10 ms | 1.26 ms |
| Groceries filter, page 1 of 19 | 0.05 ms | 0.07 ms |
| Groceries filter, page 19 of 19 | 0.05 ms | 0.08 ms |

| Concurrent reads | Result |
|---|---|
| Connections / distinct sessions | 20 / 20 |
| Duration | 20 s, after a 3 s warm-up |
| Requests | 2,325 (116 per second) |
| Latency | median 171 ms, p95 188 ms, max 234 ms |
| Non-2xx, errors, timeouts | 0, 0, 0 |

The first run found the six-month totals taking 28 ms, because SQLite read every matching row and sorted the groups. A covering index on `(customer_id, month, category, kind, amount_cents)` answers it from the index alone: 28 ms → 1.1 ms, which took throughput from 27 to 116 requests per second and p95 from 770 ms to 188 ms. One Node process renders every page, so at 20 concurrent requests most of the remaining latency is time spent waiting in line.

See also: [Architecture](architecture.md) · [Tech stack](tech-stack.md)
