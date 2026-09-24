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

Putting the app on the internet is a click-through on Render. Read [DEPLOY.md](./DEPLOY.md). Local development uses Postgres, below.

## Quick start

```bash
npm install
cp .env.example .env
# Generate your own AUTH_SECRET for anything beyond a private laptop:
# openssl rand -base64 32

docker compose up -d

# Chromium is required only when you run a live scan on the host.
# The production Docker image already contains Chromium.
npx playwright install chromium

npm run dev
```

`npm run dev` applies Prisma migrations, seeds demo data, and starts the app at [http://localhost:3000](http://localhost:3000). Postgres comes from `docker compose` (`postgresql://curepacket:curepacket@localhost:5432/curepacket`).

To run the same image Render builds:

```bash
docker compose --profile app up --build
```

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
| `npm run dev` | Migrate Postgres, seed, Next.js |
| `npm run build` | Generate Prisma client and production build |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | Re-apply idempotent demo data |
| `npm run db:reset` | Drop the database, migrate, and reseed |
| `npm run start:prod` | Migrate, seed only if `SEED_DEMO=true`, then `next start` |
| `npm run stripe:setup` | Create Stripe products/prices when `STRIPE_SECRET_KEY` is set |
| `npm run monitor:run` | Rescan active monitoring subscriptions (also the Render cron command) |
| `npm run playwright:install` | Install Chromium for scans on the host |

## Environment variables

See `.env.example`.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres URL. Local default is in `.env.example`. Render sets this from the Blueprint database. |
| `AUTH_SECRET` | Yes | Auth.js session secret. Render generates it. |
| `AUTH_URL` / `APP_URL` | Local | `http://localhost:3000`. On Render, left blank and copied from `RENDER_EXTERNAL_URL` at startup. Set both when you add a custom domain. |
| `AUTH_TRUST_HOST` | Render | `true` so Auth.js accepts Render’s proxy. The app also sets `trustHost` in code. |
| `SEED_DEMO` | Render | `true` creates the demo agency on production startup. The Blueprint defaults this to `true`. Set `false` after you create a real account. `npm run dev` always seeds. New signups never receive demo cases. |
| `RESEND_API_KEY` or `AUTH_RESEND_KEY` | No | Turns on signup confirmation and transactional email. Without it, signup skips email and notices stay in the desk. |
| `EMAIL_FROM` | No | From-address for Resend. |
| `ADMIN_EMAIL` | No | Comma-separated sign-in emails allowed to open `/admin`. |
| `STRIPE_AGENCY_PLAN_PRICE_ID` | No | Optional agency-wide Stripe Price. An active subscription waives the per-case scan and export fee. |
| `ENABLE_LLM_EXTRACT` / `OPENAI_API_KEY` | No | Heuristic extractor always works; LLM is opt-in |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Billing records a local stub when the secret key is unset. Webhook path: `/api/stripe/webhook`. Price IDs are optional. |
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
- PostgreSQL via Prisma (`prisma migrate`). Local Postgres is `docker compose up -d`.
- Auth.js (NextAuth v5) credentials + demo provider
- Playwright + axe-core
- `@react-pdf/renderer` for packets
- Stripe SDK (Checkout stubs)

## Positioning / disclaimer

CurePacket documents remediation work. Automated scans miss issues and produce false positives. Human review and qualified legal counsel are required. Overlays are explicitly out of scope.

Read [PRODUCT.md](./PRODUCT.md) for positioning, non-goals, and roadmap.
