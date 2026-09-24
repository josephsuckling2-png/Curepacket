import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/app-url";
import { agencyPlanPriceId, createAgencyPlanCheckout, stripeConfigured } from "@/lib/stripe";
import { addNotification } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action === "off" ? "off" : "on";
  const organizationId = session.user.organizationId;

  if (!stripeConfigured()) {
    const planStatus = action === "off" ? "none" : "active";
    await prisma.organization.update({
      where: { id: organizationId },
      data: { planStatus, planStripeSubId: null, planAmountCents: null },
    });
    await addNotification({
      organizationId,
      kind: "plan",
      title: planStatus === "active" ? "Practice agency plan on" : "Practice agency plan off",
      body:
        planStatus === "active"
          ? "Stripe is not configured. The practice agency plan is on, so every case can be scanned and exported without the per-case fee. No card was charged."
          : "The practice agency plan is off. Each case needs its own packet fee before a scan or export.",
    });
    return NextResponse.json({
      ok: true,
      stub: true,
      planStatus,
      message:
        planStatus === "active"
          ? "Practice agency plan is on. Scans and packet exports are unlocked for every case. No card was charged."
          : "Practice agency plan is off.",
    });
  }

  if (action === "off") {
    return NextResponse.json(
      { error: "Cancel the agency plan from the Stripe customer portal or the Stripe dashboard. The webhook will turn access off." },
      { status: 400 },
    );
  }

  if (!agencyPlanPriceId()) {
    return NextResponse.json(
      {
        error:
          "Add STRIPE_AGENCY_PLAN_PRICE_ID to sell an agency-wide plan. Until then, each case uses the packet fee.",
      },
      { status: 400 },
    );
  }

  const appUrl = appBaseUrl();
  const checkout = await createAgencyPlanCheckout({
    organizationId,
    successUrl: `${appUrl}/billing?checkout=success`,
    cancelUrl: `${appUrl}/billing?checkout=cancel`,
  });
  if (!checkout?.url) {
    return NextResponse.json({ error: "Could not create the agency plan checkout." }, { status: 500 });
  }
  return NextResponse.json({ url: checkout.url });
}
