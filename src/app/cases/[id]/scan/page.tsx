import { requireCase } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { CaseNav } from "@/components/case-nav";
import { Card, CardContent } from "@/components/ui/card";
import { ScanPanel } from "./scan-panel";
import { safeJsonParse } from "@/lib/utils";

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, record } = await requireCase(id);
  const latest = record.scans[0] ?? null;
  const pages = safeJsonParse<string[]>(latest?.pagesJson, []);
  const extra = safeJsonParse<string[]>(record.demandLetter?.listedUrls, []);

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">{record.clientName}</p>
      <h1 className="mt-1 font-serif text-4xl">Scan</h1>
      <div className="mt-6">
        <CaseNav caseId={record.id} current="/scan" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ScanPanel
          caseId={record.id}
          latest={
            latest
              ? {
                  status: latest.status,
                  pagesScanned: latest.pagesScanned,
                  completedAt: latest.completedAt?.toISOString() ?? null,
                  error: latest.error,
                  summary: latest.summaryJson,
                }
              : null
          }
        />
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Named URLs</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li>{record.siteUrl}</li>
                {extra.map((url) => (
                  <li key={url}>{url}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Pages last reached</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                {pages.length ? pages.map((url) => <li key={url}>{url}</li>) : <li>None yet</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
