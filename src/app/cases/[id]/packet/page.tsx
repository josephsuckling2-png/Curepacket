import { requireCase } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { CaseNav } from "@/components/case-nav";
import { Disclaimer } from "@/components/disclaimer";
import { IssueStatusBadge, SeverityBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addManualChangelogAction } from "@/app/actions";
import { PacketActions } from "./packet-actions";
import { packetAccessForCase } from "@/lib/access";

export default async function PacketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, record } = await requireCase(id);
  const access = await packetAccessForCase(record.id, session.user.organizationId);
  const fixed = record.issues.filter((issue) => issue.status === "fixed").length;

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">{record.clientName}</p>
      <h1 className="mt-1 font-serif text-4xl">Evidence packet</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Timestamped PDF and machine-readable JSON for counsel. {fixed} of {record.issues.length}{" "}
        findings currently marked fixed.
      </p>
      <div className="mt-6">
        <CaseNav caseId={record.id} current="/packet" />
      </div>
      <div className="mt-8 space-y-6">
        <PacketActions caseId={record.id} locked={!access.allowed} lockMessage={access.message} />
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Disclaimer included in every export</h2>
            <Disclaimer className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Issue register preview</h2>
            <div className="mt-4 divide-y divide-[#eee4d4]">
              {record.issues.map((issue) => (
                <div key={issue.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{issue.help}</p>
                    <p className="text-xs text-ink-soft">
                      {issue.wcagRule ? `WCAG ${issue.wcagRule} · ` : ""}
                      {issue.ruleId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <IssueStatusBadge status={issue.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Changelog</h2>
            <form
              action={async (formData) => {
                "use server";
                await addManualChangelogAction(id, formData);
              }}
              className="mt-4 flex gap-2"
            >
              <Input name="message" placeholder="Add a remediation note…" required />
              <Button type="submit">Add</Button>
            </form>
            <div className="mt-5 space-y-3">
              {record.changelog.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <p className="text-ink">{entry.message}</p>
                  <p className="text-xs text-ink-soft">
                    {entry.authorName} · {entry.createdAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
