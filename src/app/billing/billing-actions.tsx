"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PacketCheckoutButton({ caseId }: { caseId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMessage(data.message ?? data.error ?? "Checkout unavailable.");
    if (data.stub || data.already) {
      window.location.reload();
      return;
    }
    setBusy(false);
  }

  return (
    <div>
      <Button type="button" size="sm" onClick={start} disabled={busy}>
        {busy ? "Starting…" : "Collect packet fee"}
      </Button>
      {message ? <p className="mt-2 text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}

export function MonitorCheckoutButton({ caseId, siteUrl }: { caseId?: string; siteUrl: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/billing/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, siteUrl }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMessage(data.message ?? data.error ?? "Monitoring checkout unavailable.");
    if (data.stub) {
      window.location.reload();
      return;
    }
    setBusy(false);
  }

  return (
    <div>
      <Button type="button" size="sm" variant="outline" onClick={start} disabled={busy}>
        {busy ? "Starting…" : "Start $49/mo monitoring"}
      </Button>
      {message ? <p className="mt-2 text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}

export function AgencyPlanButton({
  active,
  stripeOn,
  priceConfigured,
}: {
  active: boolean;
  stripeOn: boolean;
  priceConfigured: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(action: "on" | "off") {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/billing/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setMessage(data.message ?? data.error ?? "Agency plan is unavailable.");
    if (data.stub) {
      window.location.reload();
      return;
    }
    setBusy(false);
  }

  const label = !stripeOn
    ? active
      ? "Turn off practice agency plan"
      : "Turn on practice agency plan"
    : "Subscribe to agency plan";

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy || (stripeOn && !priceConfigured)}
        onClick={() => start(!stripeOn && active ? "off" : "on")}
      >
        {busy ? "Starting…" : label}
      </Button>
      {stripeOn && !priceConfigured ? (
        <p className="mt-2 text-xs text-ink-muted">Add STRIPE_AGENCY_PLAN_PRICE_ID before this button can start Checkout.</p>
      ) : null}
      {message ? <p className="mt-2 text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}
