# Tech stack

The rule throughout: use the platform first, add a dependency only when it earns its place.

## Runtime

| Tool | Used for | Why this one |
|---|---|---|
| Next.js 16 (App Router) | Pages, server rendering, metadata, standalone build | Server Components read data on the server, so financial data never needs a client-side API. |
| React 19 | UI | Comes with Next.js. Client components only for the menu, focus return and the sign-in form. |
| TypeScript 6 (strict) | Everything | `noUncheckedIndexedAccess` and `verbatimModuleSyntax` on. Version 7 is a new native compiler and the tooling around it is still settling. |
| `node:sqlite` (Node 24) | Database | Built into Node: no package and no native build step in Docker. |
| `node:crypto` | Password hashing (scrypt), session tokens, SHA-256 | Standard, audited primitives; no auth library to configure. |
| `marked` | Rendering these docs at build time | Small, fast, and the docs are the repository's own Markdown. |
| Source Sans 3 and Source Serif 4 | Type | Loaded with `next/font`, self-hosted at build, so pages make no request to Google. |

## Development

| Tool | Used for |
|---|---|
| Vitest | Unit tests for money, months, reporting rules, queries, sessions and docs rendering. |
| Playwright | Browser tests against the production build at phone (360px) and desktop (1280px) sizes. |
| axe-core (`@axe-core/playwright`) | Automated accessibility checks on every page in the browser tests. |
| ESLint (`eslint-config-next`) | Linting, including React hooks and Core Web Vitals rules. |

## Left out on purpose

| Not used | Instead |
|---|---|
| An ORM | Prepared SQL in one module (`lib/data.ts`); five small tables. |
| An auth library | About 60 tested lines on `node:crypto`: one email-and-password login, server-side sessions. |
| A chart library | Two server-rendered charts (monthly spending, Live Track): SVG for lines, HTML for labels so text stays readable on a phone. The monthly chart switches to a table with the same numbers. |
| A CSS framework | CSS Modules and design tokens as CSS custom properties. |
| An icon library | 18 hand-written SVG paths on one 24px grid. |
| An animation library | CSS transitions and scroll-driven animations, the browser's View Transitions for the theme switch, and the Web Animations API for the chart and table switch. All of it is off with reduced motion. |
| Client-side data fetching or state libraries | The URL holds the state (month, category, page). |
| `tsx` or a build step for scripts | Node 24 runs the TypeScript seed scripts directly; imports use `.ts` extensions. |

## Running it

```
npm install
npm run dev          # http://localhost:3000, creates and seeds data/randsight.db
npm run db:seed      # recreate the demo database
```

Demo login: `thandi@randsight.example` / `hindsight-demo` (a fictional customer).

See also: [Architecture](architecture.md) · [Verification](verification.md)
