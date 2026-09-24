import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/app-url";
import { createMonitoringCheckout, stripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId, siteUrl } = await request.json();
  const appUrl = appBaseUrl();

  const monitor = await prisma.monitoringSubscription.create({
    data: {
      organizationId: session.user.organizationId,
      caseId: caseId || null,
      siteUrl: siteUrl || "https://example.com",
      status: stripeConfigured() ? "pending" : "active",
    },
  });

  if (!stripeConfigured()) {
    return NextResponse.json({
      ok: true,
      stub: true,
      id: monitor.id,
      message:
        "Stripe is not configured. A local $49/mo monitoring subscription record was created. Production cron alerts are out of scope for this MVP.",
    });
  }

  const checkout = await createMonitoringCheckout({
    siteUrl: monitor.siteUrl,
    caseId: monitor.caseId ?? undefined,
    monitoringId: monitor.id,
    successUrl: `${appUrl}/billing?checkout=success`,
    cancelUrl: `${appUrl}/billing?checkout=cancel`,
  });

  if (!checkout?.url) {
    return NextResponse.json({ error: "Could not create Stripe session." }, { status: 500 });
  }

  await prisma.monitoringSubscription.update({
    where: { id: monitor.id },
    data: { stripeSubId: checkout.id },
  });

  return NextResponse.json({ url: checkout.url });
}
