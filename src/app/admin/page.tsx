import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { MONITORING_FEE_CENTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession();
  if (!isAdminEmail(session.user.email)) {
    redirect("/dashboard");
  }

  const [signupCount, recentUsers, paidCount, paidCases, activeSubs, activePlans] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { organization: true },
    }),
    prisma.payment.count({ where: { status: { in: ["paid", "stub"] } } }),
    prisma.payment.findMany({
      where: { status: { in: ["paid", "stub"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { case: { include: { organization: true } } },
    }),
    prisma.monitoringSubscription.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      include: { organization: true },
    }),
    prisma.organization.findMany({
      where: { planStatus: "active" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const monitoringMrr = activeSubs.reduce((sum, item) => sum + (item.amountCents || MONITORING_FEE_CENTS), 0);
  const planMrr = activePlans.reduce((sum, item) => sum + (item.planAmountCents ?? 0), 0);
  const mrr = monitoringMrr + planMrr;

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Owner</p>
      <h1 className="mt-1 font-serif text-4xl">Admin</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Counts come from this database. Monthly recurring revenue is the sum of active monitoring
        subscriptions plus any agency-plan amount stored when Stripe reported it. One-time packet
        fees are not included.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Metric label="Signups" value={String(signupCount)} />
        <Metric label="Paid cases" value={String(paidCount)} />
        <Metric label="Active subscriptions" value={String(activeSubs.length)} />
        <Metric label="MRR" value={formatMoney(mrr)} />
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Recent signups</h2>
        <Card className="mt-4">
          <CardContent className="divide-y divide-[#eee4d4] p-0">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{user.email}</p>
                  <p className="text-ink-soft">{user.organization.name}</p>
                </div>
                <p className="text-ink-soft">{user.createdAt.toLocaleString()}</p>
              </div>
            ))}
            {recentUsers.length === 0 ? <p className="px-6 py-4 text-sm text-ink-muted">No signups yet.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Paid and practice cases</h2>
        <Card className="mt-4">
          <CardContent className="divide-y divide-[#eee4d4] p-0">
            {paidCases.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <div>
                  <Link href={`/cases/${payment.caseId}`} className="font-medium text-ink hover:underline">
                    {payment.case.clientName}
                  </Link>
                  <p className="text-ink-soft">
                    {payment.case.organization.name} · {payment.status}
                  </p>
                </div>
                <p className="text-ink">{formatMoney(payment.amountCents)}</p>
              </div>
            ))}
            {paidCases.length === 0 ? <p className="px-6 py-4 text-sm text-ink-muted">No paid cases yet.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Active monitoring subscriptions</h2>
        <Card className="mt-4">
          <CardContent className="divide-y divide-[#eee4d4] p-0">
            {activeSubs.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.siteUrl}</p>
                  <p className="text-ink-soft">{item.organization.name}</p>
                </div>
                <p className="text-ink">{formatMoney(item.amountCents || MONITORING_FEE_CENTS)}/mo</p>
              </div>
            ))}
            {activeSubs.length === 0 ? (
              <p className="px-6 py-4 text-sm text-ink-muted">No active monitoring subscriptions.</p>
            ) : null}
          </CardContent>
        </Card>
        <p className="mt-3 text-sm text-ink-muted">
          {activePlans.length} agenc{activePlans.length === 1 ? "y has" : "ies have"} an active plan
          {planMrr ? ` (${formatMoney(planMrr)}/mo stored)` : ""}.
        </p>
      </section>
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
