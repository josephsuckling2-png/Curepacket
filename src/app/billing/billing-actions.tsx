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
    setBusy(false);
  }

  return (
    <div>
      <Button type="button" size="sm" variant="outline" onClick={start} disabled={busy}>
        {busy ? "Starting…" : "Start $49/mo plan"}
      </Button>
      {message ? <p className="mt-2 text-xs text-ink-muted">{message}</p> : null}
    </div>
  );
}
