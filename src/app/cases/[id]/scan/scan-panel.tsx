"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ScanPanel({
  caseId,
  latest,
}: {
  caseId: string;
  latest: {
    status: string;
    pagesScanned: number;
    completedAt: string | null;
    error: string | null;
    summary: string | null;
  } | null;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runScan() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/scan`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Scan failed.");
      } else {
        setMessage(`Scan complete. ${data.pagesScanned} pages, ${data.issueCount} findings.`);
        window.location.reload();
      }
    } catch {
      setMessage("Network error while starting the scan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playwright + axe-core crawl</CardTitle>
        <CardDescription>
          Scans the homepage, up to 25 linked same-origin pages, and every URL named in the letter.
          Requires Chromium: <code>npx playwright install chromium</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <div className="rounded-lg border border-[#e2d8c8] bg-white p-4 text-sm">
            <p>
              Last scan: <strong>{latest.status}</strong>
              {latest.completedAt ? ` · ${new Date(latest.completedAt).toLocaleString()}` : ""}
            </p>
            <p className="mt-1 text-ink-muted">{latest.pagesScanned} pages stored</p>
            {latest.error ? <p className="mt-2 text-red-700">{latest.error}</p> : null}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No scan has been run on this case yet.</p>
        )}
        <Button onClick={runScan} disabled={busy} variant="copper">
          {busy ? "Scanning… this can take a minute" : "Run scan"}
        </Button>
        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
