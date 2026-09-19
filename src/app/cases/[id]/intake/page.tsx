import { requireCase } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { CaseNav } from "@/components/case-nav";
import { IntakeForm } from "./intake-form";
import { safeJsonParse } from "@/lib/utils";

export default async function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, record } = await requireCase(id);
  const letter = record.demandLetter;

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">{record.clientName}</p>
      <h1 className="mt-1 font-serif text-4xl">Demand-letter intake</h1>
      <div className="mt-6">
        <CaseNav caseId={record.id} current="/intake" />
      </div>
      <div className="mt-8">
        <IntakeForm
          caseId={record.id}
          initial={{
            sender: letter?.sender ?? "",
            dateReceived: letter?.dateReceived ? letter.dateReceived.toISOString().slice(0, 10) : "",
            allegedIssues: safeJsonParse<string[]>(letter?.allegedIssues, []).join("\n"),
            listedUrls: safeJsonParse<string[]>(letter?.listedUrls, []).join("\n"),
            notes: letter?.notes ?? "",
            rawText: letter?.rawText ?? "",
          }}
        />
      </div>
    </AppShell>
  );
}
