import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/status-badge";
import { daysUntil } from "@/lib/utils";

export default async function CasesPage() {
  const session = await requireSession();
  const cases = await prisma.case.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { issues: true } },
      demandLetter: true,
    },
  });

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">Cases</p>
          <h1 className="mt-1 font-serif text-4xl">Client files</h1>
        </div>
        <Button asChild variant="copper">
          <Link href="/cases/new">New case</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4">
        {cases.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href={`/cases/${item.id}`} className="font-serif text-2xl hover:underline">
                  {item.clientName}
                </Link>
                <p className="mt-1 text-sm text-ink-muted">{item.siteUrl}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  {item._count.issues} stored findings
                  {item.demandLetter?.sender ? ` · Letter from ${item.demandLetter.sender}` : " · Intake incomplete"}
                  {item.deadlineAt ? ` · ${daysUntil(item.deadlineAt)} days on the clock` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CaseStatusBadge status={item.status} />
                <Button asChild variant="outline" size="sm">
                  <Link href={`/cases/${item.id}`}>Open</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {cases.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-sm text-ink-muted">
              No cases yet. Create one to start letter intake.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
