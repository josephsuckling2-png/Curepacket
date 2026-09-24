import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { notifyPacketFee } from "@/lib/notify";

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
    case "checkout.session.async_payment_failed":
      await onCheckoutFailed(event.data.object);
      return;
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await onSubscriptionChanged(event.data.object);
      return;
    case "invoice.payment_failed":
      await onInvoicePaymentFailed(event.data.object);
      return;
    case "payment_intent.payment_failed": {
      const intent = event.data.object;
      const caseId = intent.metadata?.caseId;
      if (intent.metadata?.kind === "packet" && caseId) {
        await prisma.payment.updateMany({
          where: { caseId, status: "pending" },
          data: { status: "unpaid" },
        });
        await addChangelog(caseId, "Stripe reported the packet payment failed.", "Stripe");
      }
      return;
    }
    default:
      return;
  }
}

function subscriptionIdOf(value: unknown) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

function planStatusFor(subscriptionStatus: string) {
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") return "active";
  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") return "past_due";
  return "canceled";
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
    await notifyPacketFee({
      organizationId: record.organizationId,
      caseId,
      clientName: record.clientName,
      amountCents: amount ?? 0,
      practice: false,
    });
    return;
  }

  if (kind === "plan") {
    const organizationId = session.metadata?.organizationId;
    if (!organizationId) return;
    const subscriptionId = subscriptionIdOf(session.subscription);
    await prisma.organization.updateMany({
      where: { id: organizationId },
      data: {
        planStatus: "active",
        planStripeSubId: subscriptionId,
        ...(session.amount_total ? { planAmountCents: session.amount_total } : {}),
      },
    });
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

async function onCheckoutFailed(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind === "packet" && session.metadata.caseId) {
    await prisma.payment.updateMany({
      where: { caseId: session.metadata.caseId },
      data: { status: "unpaid", stripeSessionId: session.id },
    });
    await addChangelog(session.metadata.caseId, "Stripe reported the packet payment failed.", "Stripe");
  }
  if (session.metadata?.kind === "plan" && session.metadata.organizationId) {
    await prisma.organization.updateMany({
      where: { id: session.metadata.organizationId },
      data: { planStatus: "canceled" },
    });
  }
  if (session.metadata?.kind === "monitoring" && session.metadata.monitoringId) {
    await prisma.monitoringSubscription.updateMany({
      where: { id: session.metadata.monitoringId },
      data: { status: "canceled", canceledAt: new Date() },
    });
  }
}

async function onSubscriptionChanged(subscription: Stripe.Subscription) {
  const active = subscription.status === "active" || subscription.status === "trialing";
  const status = active ? "active" : subscription.status === "past_due" || subscription.status === "unpaid" ? "past_due" : "canceled";
  const monitoringId = subscription.metadata?.monitoringId;
  await prisma.monitoringSubscription.updateMany({
    where: monitoringId ? { OR: [{ stripeSubId: subscription.id }, { id: monitoringId }] } : { stripeSubId: subscription.id },
    data: {
      status,
      stripeSubId: subscription.id,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : active
          ? null
          : new Date(),
    },
  });

  if (subscription.metadata?.kind === "plan" || subscription.metadata?.organizationId) {
    const organizationId = subscription.metadata.organizationId;
    await prisma.organization.updateMany({
      where: organizationId
        ? { OR: [{ id: organizationId }, { planStripeSubId: subscription.id }] }
        : { planStripeSubId: subscription.id },
      data: {
        planStatus: planStatusFor(subscription.status),
        planStripeSubId: subscription.id,
      },
    });
  } else {
    await prisma.organization.updateMany({
      where: { planStripeSubId: subscription.id },
      data: { planStatus: planStatusFor(subscription.status) },
    });
  }
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = subscriptionIdOf(
    (invoice as Stripe.Invoice & { subscription?: string | { id: string } | null }).subscription,
  );
  if (!subscriptionId) return;
  await prisma.monitoringSubscription.updateMany({
    where: { stripeSubId: subscriptionId },
    data: { status: "past_due" },
  });
  await prisma.organization.updateMany({
    where: { planStripeSubId: subscriptionId },
    data: { planStatus: "past_due" },
  });
}
