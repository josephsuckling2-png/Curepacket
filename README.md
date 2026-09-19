# CurePacket

**Demand letter in → counsel-ready accessibility remediation packet out.**

CurePacket is a Next.js MVP for agencies handling ADA / web-accessibility demand letters. It is a **workflow and documentation desk for counsel review** — not a scanner product, not an overlay, and not a law firm.

We help your team find issues, organize remediation, document changes, and prepare a review packet. **CurePacket does not provide legal advice, does not certify WCAG or ADA compliance, and does not claim lawsuit protection.**

## What you can do in this MVP

1. Sign in (email/password, demo agency, or Auth.js-ready magic-link stub)
2. Create and manage **cases** (client, site URL, status, cure-window date)
3. Capture **demand-letter intake** (or paste letter text for heuristic extraction)
4. Run a **Playwright + axe-core** scan of the homepage, up to ~25 same-origin pages, and named URLs
5. Work a **prioritized fix board** (severity filters, before/after notes, status)
6. Export a **PDF evidence packet** and a **ZIP of PDF + JSON**
7. Use **Stripe Checkout stubs** for a per-case packet fee ($750 default) and a $49/mo monitoring plan

## Quick start

```bash
npm install
cp .env.example .env
# AUTH_SECRET is already set in the committed local .env for demo;
# generate your own for anything beyond localhost:
# openssl rand -base64 32

# Chromium is required only when you run a live scan
npx playwright install chromium

npm run dev
```

`npm run dev` pushes the SQLite schema, seeds demo data, and starts the app at [http://localhost:3000](http://localhost:3000).

### Demo login

| Field | Value |
| --- | --- |
| Email | `demo@curepacket.dev` |
| Password | `demo1234` |
| Agency | Harbor & Co. Digital |

Or click **Continue as demo agency** on `/login`.

Seeded cases:

- **Northwind Provisions** — remediating, with a pre-seeded scan and 8 findings
- **Cedar Street Dental** — intake only

A local fixture site with intentional accessibility defects lives at `/fixtures/demo-site/index.html`. Point a case at `http://localhost:3000/fixtures/demo-site/index.html` to scan without leaving the machine.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | `prisma db push` + seed + Next.js |
| `npm run build` | Generate Prisma client and production build |
| `npm run db:seed` | Re-apply idempotent demo data |
| `npm run db:reset` | Wipe SQLite and reseed |
| `npm run playwright:install` | Install Chromium for scans |

## Environment variables

See `.env.example`.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Default `file:./dev.db` (SQLite) |
| `AUTH_SECRET` | Yes | Auth.js session secret |
| `AUTH_URL` | Local | `http://localhost:3000` |
| `ENABLE_LLM_EXTRACT` / `OPENAI_API_KEY` | No | Heuristic extractor always works; LLM is opt-in |
| `STRIPE_SECRET_KEY` and related | No | Billing UI records a local stub when unset |
| `DEFAULT_PACKET_FEE_CENTS` | No | Defaults to `75000` ($750) |
| `MONITORING_FEE_CENTS` | No | Defaults to `4900` ($49) |

## Playwright browsers

Live scans use Playwright Chromium + axe-core. After `npm install`:

```bash
npx playwright install chromium
# or
npm run playwright:install
```

If Chromium is missing, the scan API returns an install hint and the seeded Northwind board still works.

On Linux you may also need OS dependencies:

```bash
npx playwright install-deps chromium
```

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI
- SQLite via Prisma
- Auth.js (NextAuth v5) credentials + demo provider
- Playwright + axe-core
- `@react-pdf/renderer` for packets
- Stripe SDK (Checkout stubs)

## Positioning / disclaimer

CurePacket documents remediation work. Automated scans miss issues and produce false positives. Human review and qualified legal counsel are required. Overlays are explicitly out of scope.

Read [PRODUCT.md](./PRODUCT.md) for positioning, non-goals, and roadmap.
