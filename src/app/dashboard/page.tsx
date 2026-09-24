import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/status-badge";
import { daysUntil, formatMoney } from "@/lib/utils";
import { CASE_STATUS_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await requireSession();
  const orgId = session.user.organizationId;

  const [cases, openIssues, unpaid, monitors] = await Promise.all([
    prisma.case.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { issues: true } } },
    }),
    prisma.issue.count({
      where: {
        case: { organizationId: orgId },
        status: { in: ["open", "in_progress"] },
      },
    }),
    prisma.payment.count({
      where: { case: { organizationId: orgId }, status: "unpaid" },
    }),
    prisma.monitoringSubscription.count({
      where: { organizationId: orgId, status: { in: ["active", "pending"] } },
    }),
  ]);

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const notifications = await prisma.notification.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const dueSoon = cases.filter((item) => {
    const days = daysUntil(item.deadlineAt);
    return days !== null && days <= 21 && item.status !== "closed";
  });

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper">Desk</p>
          <h1 className="mt-1 font-serif text-4xl text-ink">Active cure work</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Cases, scan findings, and packet exports for {session.user.organizationName}. This desk
            documents remediation work for counsel — it does not certify compliance.
          </p>
        </div>
        <Button asChild variant="copper">
          <Link href="/cases/new">Open a case</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric label="Open cases" value={String(cases.filter((item) => item.status !== "closed").length)} />
        <Metric label="Open findings" value={String(openIssues)} />
        <Metric label="Unpaid packets" value={String(unpaid)} />
        <Metric label="Monitoring plans" value={String(monitors)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl">Recent cases</h2>
              <Link href="/cases" className="text-sm text-copper hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-5 divide-y divide-[#eee4d4]">
              {cases.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/cases/${item.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-parchment/40"
                >
                  <div>
                    <p className="font-medium text-ink">{item.clientName}</p>
                    <p className="text-xs text-ink-soft">{item.siteUrl}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-ink-soft sm:inline">
                      {item._count.issues} issues
                    </span>
                    <CaseStatusBadge status={item.status} />
                  </div>
                </Link>
              ))}
              {cases.length === 0 ? (
                <p className="py-6 text-sm text-ink-muted">No cases yet. Open one to begin intake.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Notices</h2>
              <div className="mt-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-ink-muted">
                    Payment notes, packet-ready notes, and monitoring alerts show up here. Email is sent
                    only when a mail key is set.
                  </p>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="text-sm">
                      <p className="font-medium text-ink">{item.title}</p>
                      <p className="whitespace-pre-wrap text-ink-muted">{item.body}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Cure windows</h2>
              <div className="mt-4 space-y-3">
                {dueSoon.length === 0 ? (
                  <p className="text-sm text-ink-muted">No deadlines inside 21 days.</p>
                ) : (
                  dueSoon.map((item) => (
                    <Link key={item.id} href={`/cases/${item.id}`} className="block text-sm">
                      <span className="font-medium text-ink">{item.clientName}</span>
                      <span className="ml-2 text-ink-soft">{daysUntil(item.deadlineAt)} days</span>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl">Packet fee</h2>
              <p className="mt-2 font-serif text-4xl">{formatMoney(org?.packetFeeCents ?? 75000)}</p>
              <p className="mt-2 text-sm text-ink-muted">
                Configurable in settings. Stripe Checkout appears when keys are set.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-soft">
                {Object.entries(CASE_STATUS_LABELS).map(([key, label]) => (
                  <span key={key}>{label}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{label}</p>
        <p className="mt-2 font-serif text-3xl text-ink">{value}</p>
      </CardContent>
    </Card>
  );
}
