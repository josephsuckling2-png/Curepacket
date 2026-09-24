import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { appBaseUrl } from "@/lib/app-url";
import { createPacketCheckout, packetFeeCents, stripeConfigured } from "@/lib/stripe";
import { paymentGrantsAccess } from "@/lib/access";
import { notifyPacketFee } from "@/lib/notify";

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

  if (record.organization.planStatus === "active" || paymentGrantsAccess(record.payment?.status)) {
    return NextResponse.json({
      ok: true,
      already: true,
      message: "This case is already unlocked for scans and packet export.",
    });
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
    await notifyPacketFee({
      organizationId: record.organizationId,
      caseId: record.id,
      clientName: record.clientName,
      amountCents: amount,
      practice: true,
    });
    return NextResponse.json({
      ok: true,
      stub: true,
      message:
        "Stripe is not configured. A practice payment was recorded and this case is unlocked for scans and packet export. No card was charged.",
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
