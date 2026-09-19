# CurePacket product

**One-liner:** Demand letter in → counsel-ready accessibility remediation packet out.

**Safe positioning:** We help your team find issues, organize remediation, document changes, and prepare a review packet for counsel. We do not provide legal advice or guarantee compliance.

## Why this exists

SMB owners, their web agency, and counsel often lack a shared desk after an ADA / web-accessibility demand letter. Enterprise scanners are priced and processed for Fortune 500 programs. Overlays are a legally weak shortcut (and are **not** part of this product). CurePacket is incident-response documentation: intake, scan, fix board, timestamped packet.

2025–2026 context that informs the wedge (not a legal claim): high digital-accessibility filing volume, WebAIM Million detectable-error rates still extremely high, and state cure-period statutes that make *good-faith remediation evidence* the job to be done.

## Who pays

**Primary buyer:** a web agency running letters for SMB clients.

Also: WordPress / Shopify freelancers, accessibility consultants, and small-business law firms that want a white-label packet workflow.

## What shipped in this MVP

- Auth + organization (credentials, demo seed user, magic-link stub / Clerk-ready pattern)
- Case CRUD with statuses: intake → scanning → remediating → packet ready → closed
- Demand-letter intake + paste-to-extract heuristics (optional LLM behind env flag)
- Playwright + axe-core crawl (homepage + ≤25 same-origin links + letter URLs)
- Prioritized fix board with proof notes and changelog
- PDF + ZIP evidence packet with a documentation-not-advice disclaimer
- Stripe Checkout stubs: per-case packet fee (default $750, configurable) and $49/mo monitoring plan
- Marketing landing with professional B2B positioning

## Explicit non-goals

- Overlay / accessibility widget
- Legal opinions or WCAG certification
- Enterprise SSO
- Production monitoring cron (the subscription record and billing stub are enough)

## Revenue sketch

- Per-case emergency packet: **$500–$1,500** (product default $750)
- Ongoing site monitoring: **~$49/mo** (modeled; alerts later)

## Roadmap

1. Human-review queue and assignment (developer vs specialist vs designer)
2. Real screenshot storage (R2/S3) and side-by-side before/after in the PDF
3. Background scan worker (Playwright does not belong on serverless)
4. Monthly monitoring cron + email alert
5. Client status page / invite link
6. White-label PDF cover (agency mark, counsel address block)
7. Rescan diff that does not wipe manual proof notes
8. Firm seat roles beyond owner

## Language we will not use

- “WCAG compliant”
- “ADA certified”
- “Lawsuit protection”
- “Overlays fix accessibility”
- “This packet is legal advice”
