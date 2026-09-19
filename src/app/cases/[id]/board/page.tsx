import { requireCase } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { CaseNav } from "@/components/case-nav";
import { FixBoard } from "./board";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, record } = await requireCase(id);

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">{record.clientName}</p>
      <h1 className="mt-1 font-serif text-4xl">Prioritized fix board</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Grouped by severity. Automated findings are a starting inventory — not a complete WCAG audit.
      </p>
      <div className="mt-6">
        <CaseNav caseId={record.id} current="/board" />
      </div>
      <div className="mt-8">
        <FixBoard
          caseId={record.id}
          issues={record.issues.map((issue) => ({
            id: issue.id,
            pageUrl: issue.pageUrl,
            severity: issue.severity,
            wcagRule: issue.wcagRule,
            ruleId: issue.ruleId,
            help: issue.help,
            description: issue.description,
            selector: issue.selector,
            snippet: issue.snippet,
            status: issue.status,
            beforeNotes: issue.beforeNotes,
            afterNotes: issue.afterNotes,
            beforeScreenshot: issue.beforeScreenshot,
          }))}
        />
      </div>
    </AppShell>
  );
}
