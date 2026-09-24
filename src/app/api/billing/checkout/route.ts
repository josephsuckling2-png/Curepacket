import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { appBaseUrl } from "@/lib/app-url";
import { createPacketCheckout, packetFeeCents, stripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await request.json();
  const record = await prisma.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
    include: { organization: true, payment: true },
  });
  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const amount = packetFeeCents(record.organization.packetFeeCents);
  const appUrl = appBaseUrl();

  const payment = await prisma.payment.upsert({
    where: { caseId: record.id },
    update: { amountCents: amount, kind: "packet" },
    create: { caseId: record.id, amountCents: amount, kind: "packet", status: "unpaid" },
  });

  if (!stripeConfigured()) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "stub" },
    });
    await addChangelog(
      record.id,
      `Packet fee stub recorded at $${(amount / 100).toFixed(0)} (Stripe unset).`,
      session.user.name,
    );
    return NextResponse.json({
      ok: true,
      stub: true,
      message:
        "Stripe is not configured. A local stub payment was recorded so you can keep working the case. Add STRIPE_SECRET_KEY to enable Checkout.",
    });
  }

  const checkout = await createPacketCheckout({
    caseId: record.id,
    caseName: record.clientName,
    amountCents: amount,
    successUrl: `${appUrl}/billing?checkout=success`,
    cancelUrl: `${appUrl}/billing?checkout=cancel`,
  });

  if (!checkout?.url) {
    return NextResponse.json({ error: "Could not create Stripe session." }, { status: 500 });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: checkout.id, status: "pending" },
  });

  return NextResponse.json({ url: checkout.url });
}
