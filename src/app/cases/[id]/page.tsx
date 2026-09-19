import Link from "next/link";
import { requireCase } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { CaseNav } from "@/components/case-nav";
import { CaseStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteCaseAction, updateCaseAction } from "@/app/actions";
import { CASE_STATUSES, CASE_STATUS_LABELS } from "@/lib/constants";
import { daysUntil, safeJsonParse } from "@/lib/utils";

export default async function CaseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, record } = await requireCase(id);
  const alleged = safeJsonParse<string[]>(record.demandLetter?.allegedIssues, []);
  const urls = safeJsonParse<string[]>(record.demandLetter?.listedUrls, []);
  const remaining = record.issues.filter((issue) => issue.status === "open" || issue.status === "in_progress").length;
  const deadline = daysUntil(record.deadlineAt);

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">Case</p>
          <h1 className="mt-1 font-serif text-4xl">{record.clientName}</h1>
          <p className="mt-2 text-sm text-ink-muted">{record.siteUrl}</p>
        </div>
        <CaseStatusBadge status={record.status} />
      </div>
      <div className="mt-6">
        <CaseNav caseId={record.id} current="" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Cure window</p>
            <p className="mt-2 font-serif text-3xl">{deadline === null ? "—" : `${deadline} days`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Open findings</p>
            <p className="mt-2 font-serif text-3xl">{remaining}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Scans</p>
            <p className="mt-2 font-serif text-3xl">{record.scans.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-serif text-2xl">Update file</h2>
            <form
              action={async (formData) => {
                "use server";
                await updateCaseAction(id, formData);
              }}
              className="mt-5 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client</Label>
                  <Input id="clientName" name="clientName" defaultValue={record.clientName} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client email</Label>
                  <Input id="clientEmail" name="clientEmail" defaultValue={record.clientEmail ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl">Site URL</Label>
                <Input id="siteUrl" name="siteUrl" defaultValue={record.siteUrl} required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={record.status}
                    className="flex h-10 w-full rounded-md border border-[#d7cbb8] bg-white px-3 text-sm"
                  >
                    {CASE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CASE_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadlineAt">Deadline</Label>
                  <Input
                    id="deadlineAt"
                    name="deadlineAt"
                    type="date"
                    defaultValue={record.deadlineAt ? record.deadlineAt.toISOString().slice(0, 10) : ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={record.notes ?? ""} />
              </div>
              <Button type="submit">Save changes</Button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteCaseAction(id);
              }}
              className="mt-4"
            >
              <Button type="submit" variant="outline">
                Delete case
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Letter snapshot</h2>
              <p className="mt-3 text-sm text-ink-muted">
                Sender: {record.demandLetter?.sender ?? "Not recorded"}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                {alleged.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/cases/${record.id}/intake`}>Edit intake</Link>
                </Button>
                <Button asChild size="sm" variant="copper">
                  <Link href={`/cases/${record.id}/scan`}>Scan</Link>
                </Button>
              </div>
              {urls.length ? (
                <p className="mt-4 text-xs text-ink-soft">{urls.length} named URLs</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Recent log</h2>
              <div className="mt-4 space-y-3">
                {record.changelog.slice(0, 5).map((entry) => (
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
      </div>
    </AppShell>
  );
}
