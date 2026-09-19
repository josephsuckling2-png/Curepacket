"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PacketActions({ caseId }: { caseId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function markReady() {
    const response = await fetch(`/api/cases/${caseId}/packet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markReady: true }),
    });
    const data = await response.json();
    setMessage(data.error ?? "Case marked packet ready.");
    if (response.ok) window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="copper">
        <a href={`/api/cases/${caseId}/packet`} target="_blank" rel="noreferrer">
          Download PDF
        </a>
      </Button>
      <Button asChild variant="outline">
        <a href={`/api/cases/${caseId}/packet/zip`}>Download ZIP (PDF + JSON)</a>
      </Button>
      <Button type="button" variant="ghost" onClick={markReady}>
        Mark packet ready
      </Button>
      {message ? <p className="w-full text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}
