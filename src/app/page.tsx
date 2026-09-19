import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, FileText, ScanSearch, ShieldAlert, Stamp } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { PRODUCT_ONE_LINER } from "@/lib/constants";

const steps = [
  {
    title: "Intake the letter",
    body: "Capture sender, date received, alleged issues, and named URLs. Paste the letter and we’ll extract what we can — you remain the editor of record.",
  },
  {
    title: "Scan what was named",
    body: "Playwright + axe-core crawl the homepage, up to 25 same-origin pages, and every URL listed in the letter.",
  },
  {
    title: "Work the fix board",
    body: "Prioritize by severity, attach before/after notes, mark remediations, and keep a changelog counsel can read.",
  },
  {
    title: "Export the packet",
    body: "Generate a timestamped PDF and ZIP (JSON + PDF) with case meta, letter summary, scan results, and a plain-language disclaimer.",
  },
];

const buyers = [
  {
    title: "Web agencies",
    body: "Run multiple SMB letters without inventing a new spreadsheet for every panic.",
  },
  {
    title: "WP / Shopify freelancers",
    body: "Turn a demand letter into a scoped remediation job with evidence attached.",
  },
  {
    title: "Accessibility consultants",
    body: "Keep automated findings, manual notes, and counsel-facing artifacts in one desk.",
  },
  {
    title: "Small-business firms",
    body: "White-label the packet workflow for clients who already have a web vendor.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />
      <section className="relative overflow-hidden paper-grid">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:pt-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-copper">Agency accessibility desk</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.08] text-ink md:text-6xl">
              {PRODUCT_ONE_LINER}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
              When an SMB forwards an ADA or web-accessibility demand letter, your team needs a shared
              workflow: parse the claim, find what automated tools can see, document the fixes, and
              hand counsel a packet — not a folder of screenshots in Slack.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="copper" size="lg">
                <Link href="/login?demo=1">
                  Open the demo desk <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Create an agency account</Link>
              </Button>
            </div>
            <p className="mt-5 max-w-lg text-sm text-ink-soft">
              Built for incident response. Not a scanner product. Not an overlay.
            </p>
          </div>
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-[#e2d8c8] bg-navy px-6 py-4 text-parchment">
                <p className="text-[11px] uppercase tracking-[0.18em] text-copper-soft">Sample packet cover</p>
                <p className="mt-1 font-serif text-2xl">Northwind Provisions</p>
                <p className="text-sm text-parchment/70">Harbor &amp; Co. Digital · cure window 41 days</p>
              </div>
              <div className="space-y-4 p-6">
                {[
                  ["Letter", "Reed & Feldman LLP · 3 named URLs"],
                  ["Scan", "3 pages · 8 automated findings"],
                  ["Board", "1 fixed · 1 in progress · 5 open"],
                  ["Export", "PDF + JSON evidence bundle"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-ink-soft">{label}</span>
                    <span className="text-right font-medium text-ink">{value}</span>
                  </div>
                ))}
                <div className="stamp rounded-md bg-copper-soft/50 px-3 py-2 text-xs text-copper">
                  Documentation for counsel review. Not a compliance certificate.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-[#e2d8c8] bg-parchment-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-3">
          <Stat
            icon={<ShieldAlert className="h-5 w-5" />}
            label="The job to be done"
            value="Prove good-faith work inside a cure window"
          />
          <Stat
            icon={<ScanSearch className="h-5 w-5" />}
            label="What we automate"
            value="Intake, crawl, prioritize, timestamp"
          />
          <Stat
            icon={<FileText className="h-5 w-5" />}
            label="What we never claim"
            value="Legal advice, WCAG guarantees, lawsuit protection"
          />
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">How it works</p>
        <h2 className="mt-3 font-serif text-4xl text-ink">A desk, not another widget.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">0{index + 1}</p>
                <h3 className="mt-2 font-serif text-2xl">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="who" className="bg-navy text-parchment">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs uppercase tracking-[0.22em] text-copper">Primary buyer</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl">
            Agencies running accessibility letters for SMB clients.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {buyers.map((buyer) => (
              <div key={buyer.title} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-serif text-2xl">{buyer.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-parchment/75">{buyer.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-copper">Pricing sketch</p>
        <h2 className="mt-3 font-serif text-4xl text-ink">High-ticket packet. Quiet retainer.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card>
            <CardContent className="p-8">
              <p className="text-sm text-ink-soft">Per-case packet</p>
              <p className="mt-2 font-serif text-5xl text-ink">$750</p>
              <p className="mt-2 text-sm text-ink-muted">Default fee, configurable per agency.</p>
              <ul className="mt-6 space-y-2 text-sm text-ink-muted">
                {[
                  "Letter intake and named-URL scan",
                  "Prioritized fix board",
                  "Before/after notes and changelog",
                  "PDF + ZIP evidence export",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-forest" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8">
              <p className="text-sm text-ink-soft">Optional monitoring</p>
              <p className="mt-2 font-serif text-5xl text-ink">$49<span className="text-2xl">/mo</span></p>
              <p className="mt-2 text-sm text-ink-muted">
                Subscription record and Stripe Checkout stub. Production cron is a later milestone.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-ink-muted">
                {[
                  "Site attached to a closed or active case",
                  "Plan status visible on the billing desk",
                  "Intended for monthly rescan + alert later",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-forest" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="positioning" className="border-t border-[#e2d8c8] bg-parchment-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex items-start gap-3">
            <Stamp className="mt-1 h-5 w-5 text-copper" />
            <div>
              <h2 className="font-serif text-3xl text-ink">What CurePacket is — and is not</h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-muted">
                We help your team find issues, organize remediation, document changes, and prepare a
                review packet for counsel. We do not provide legal advice, guarantee WCAG or ADA
                compliance, or promise lawsuit protection. Overlays are out of scope; they are not a
                substitute for remediating the site.
              </p>
              <Disclaimer className="mt-6 max-w-3xl" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e2d8c8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} CurePacket</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-ink">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-ink">
              Create account
            </Link>
            <Link href="/dashboard" className="hover:text-ink">
              Desk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-copper">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{label}</p>
        <p className="mt-1 font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
