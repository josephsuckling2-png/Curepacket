import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { stripeConfigured } from "@/lib/stripe";
import { AgencyPlanButton, PacketCheckoutButton, MonitorCheckoutButton } from "./billing-actions";
import { agencyPlanPriceId } from "@/lib/stripe";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });
  const cases = await prisma.case.findMany({
    where: { organizationId: session.user.organizationId },
    include: { payment: true, monitoringSubscriptions: true },
    orderBy: { updatedAt: "desc" },
  });
  const monitors = await prisma.monitoringSubscription.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });
  const configured = stripeConfigured();

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Billing</p>
      <h1 className="mt-1 font-serif text-4xl">Packet fees and monitoring</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        A scan or packet export needs the per-case fee unless the agency plan is active. Monitoring
        is $49 a month per site and is rescanned on the monthly job. When Stripe keys are unset, the
        buttons record a practice payment and do not charge a card.
      </p>
      {params.checkout === "success" ? (
        <p className="mt-4 rounded-md bg-forest-soft px-3 py-2 text-sm text-forest">
          Checkout returned successfully. In test mode, confirm the session in the Stripe dashboard.
        </p>
      ) : null}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Default packet fee</p>
            <p className="mt-2 font-serif text-4xl">{formatMoney(org?.packetFeeCents ?? 75000)}</p>
            <p className="mt-2 text-sm text-ink-muted">
              Stripe: {configured ? "test keys detected" : "not configured — graceful stub mode"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Monitoring</p>
            <p className="mt-2 font-serif text-4xl">$49/mo</p>
            <p className="mt-2 text-sm text-ink-muted">
              {monitors.filter((item) => item.status === "active").length} active site subscription
              {monitors.filter((item) => item.status === "active").length === 1 ? "" : "s"}. Agency
              plan: {org?.planStatus ?? "none"}.
            </p>
            <div className="mt-4">
              <AgencyPlanButton
                active={org?.planStatus === "active"}
                stripeOn={configured}
                priceConfigured={Boolean(agencyPlanPriceId())}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8 space-y-4">
        {cases.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <Link href={`/cases/${item.id}`} className="font-serif text-xl hover:underline">
                  {item.clientName}
                </Link>
                <p className="text-sm text-ink-muted">
                  Packet: {item.payment?.status ?? "unpaid"} ·{" "}
                  {formatMoney(item.payment?.amountCents ?? org?.packetFeeCents ?? 75000)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PacketCheckoutButton caseId={item.id} />
                <MonitorCheckoutButton caseId={item.id} siteUrl={item.siteUrl} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
