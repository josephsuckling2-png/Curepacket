"use client";

import { useMemo, useState } from "react";
import { updateIssueAction } from "@/app/actions";
import { IssueStatusBadge, SeverityBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS, SEVERITIES, SEVERITY_ORDER } from "@/lib/constants";

type BoardIssue = {
  id: string;
  pageUrl: string;
  severity: string;
  wcagRule: string | null;
  ruleId: string | null;
  help: string;
  description: string | null;
  selector: string | null;
  snippet: string | null;
  status: string;
  beforeNotes: string | null;
  afterNotes: string | null;
  beforeScreenshot: string | null;
};

export function FixBoard({ caseId, issues }: { caseId: string; issues: BoardIssue[] }) {
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(issues[0]?.id ?? null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return [...issues]
      .filter((issue) => (severity === "all" ? true : issue.severity === severity))
      .filter((issue) => (status === "all" ? true : issue.status === status))
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
  }, [issues, severity, status]);

  const active = filtered.find((issue) => issue.id === activeId) ?? filtered[0] ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            className="h-10 rounded-md border border-[#d7cbb8] bg-white px-3 text-sm"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="all">All severities</option>
            {SEVERITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-[#d7cbb8] bg-white px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {ISSUE_STATUSES.map((item) => (
              <option key={item} value={item}>
                {ISSUE_STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {filtered.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => setActiveId(issue.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                active?.id === issue.id ? "border-ink bg-white" : "border-[#e2d8c8] bg-parchment-card"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <SeverityBadge severity={issue.severity} />
                <IssueStatusBadge status={issue.status} />
              </div>
              <p className="mt-2 font-medium text-ink">{issue.help}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {issue.wcagRule ? `WCAG ${issue.wcagRule} · ` : ""}
                {issue.ruleId} · {issue.pageUrl}
              </p>
            </button>
          ))}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-ink-muted">
                No findings match these filters. Run a scan or loosen the filters.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      {active ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap gap-2">
              <SeverityBadge severity={active.severity} />
              <IssueStatusBadge status={active.status} />
            </div>
            <h2 className="font-serif text-2xl">{active.help}</h2>
            <p className="text-sm text-ink-muted">{active.description}</p>
            <p className="text-xs text-ink-soft">{active.pageUrl}</p>
            {active.selector ? (
              <p className="rounded-md bg-parchment-deep px-3 py-2 font-mono text-xs">{active.selector}</p>
            ) : null}
            {active.snippet ? (
              <pre className="overflow-x-auto rounded-md bg-ink px-3 py-2 text-xs text-parchment">
                {active.snippet}
              </pre>
            ) : null}
            {active.beforeScreenshot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.beforeScreenshot}
                alt="Captured element before remediation"
                className="max-h-48 rounded-md border border-[#e2d8c8]"
              />
            ) : null}
            <form
              className="space-y-4"
              action={async (formData) => {
                setBusy(true);
                await updateIssueAction(caseId, active.id, {
                  status: String(formData.get("status")),
                  beforeNotes: String(formData.get("beforeNotes")),
                  afterNotes: String(formData.get("afterNotes")),
                });
                setBusy(false);
                window.location.reload();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="status">Remediation status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={active.status}
                  className="flex h-10 w-full rounded-md border border-[#d7cbb8] bg-white px-3 text-sm"
                >
                  {ISSUE_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {ISSUE_STATUS_LABELS[item]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="beforeNotes">Before notes</Label>
                <Textarea
                  id="beforeNotes"
                  name="beforeNotes"
                  defaultValue={active.beforeNotes ?? ""}
                  placeholder="What the page did when the finding was observed."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="afterNotes">After notes / rescan diff</Label>
                <Textarea
                  id="afterNotes"
                  name="afterNotes"
                  defaultValue={active.afterNotes ?? ""}
                  placeholder="What changed. If you re-ran a scan, note what disappeared or remained."
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save proof notes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
