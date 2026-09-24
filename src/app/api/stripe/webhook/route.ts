import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET, then send webhooks to /api/stripe/webhook.",
      },
      { status: 503 },
    );
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not set. Add it before Stripe can confirm payments." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe client is unavailable." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (error) {
    console.error("Stripe webhook handler failed", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await onCheckoutCompleted(event.data.object);
      return;
    case "checkout.session.expired":
      await onCheckoutExpired(event.data.object);
      return;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await onSubscriptionChanged(event.data.object);
      return;
    default:
      return;
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  const caseId = session.metadata?.caseId;

  if (kind === "packet" && caseId) {
    const record = await prisma.case.findUnique({ where: { id: caseId } });
    if (!record) return;
    const amount = session.amount_total ?? undefined;
    await prisma.payment.upsert({
      where: { caseId },
      update: {
        status: "paid",
        stripeSessionId: session.id,
        ...(amount ? { amountCents: amount } : {}),
      },
      create: {
        caseId,
        amountCents: amount ?? 0,
        status: "paid",
        kind: "packet",
        stripeSessionId: session.id,
      },
    });
    await addChangelog(caseId, "Stripe marked the packet fee paid.", "Stripe");
    return;
  }

  if (kind === "monitoring") {
    const monitoringId = session.metadata?.monitoringId;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.id;
    if (monitoringId) {
      await prisma.monitoringSubscription.updateMany({
        where: { id: monitoringId },
        data: { status: "active", stripeSubId: subscriptionId },
      });
      return;
    }
    await prisma.monitoringSubscription.updateMany({
      where: { stripeSubId: session.id },
      data: { status: "active", stripeSubId: subscriptionId },
    });
  }
}

async function onCheckoutExpired(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== "packet") return;
  const caseId = session.metadata.caseId;
  if (!caseId) return;
  await prisma.payment.updateMany({
    where: { caseId, status: "pending", stripeSessionId: session.id },
    data: { status: "unpaid" },
  });
}

async function onSubscriptionChanged(subscription: Stripe.Subscription) {
  const active = subscription.status === "active" || subscription.status === "trialing";
  await prisma.monitoringSubscription.updateMany({
    where: { stripeSubId: subscription.id },
    data: {
      status: active ? "active" : "canceled",
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : active
          ? null
          : new Date(),
    },
  });
}
