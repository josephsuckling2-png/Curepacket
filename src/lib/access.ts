import { prisma } from "@/lib/prisma";
import { stripeConfigured } from "@/lib/stripe";

export function paymentGrantsAccess(status: string | null | undefined) {
  return status === "paid" || status === "stub";
}

export async function packetAccessForCase(caseId: string, organizationId: string) {
  const record = await prisma.case.findFirst({
    where: { id: caseId, organizationId },
    include: { payment: true, organization: true },
  });
  if (!record) {
    return { allowed: false, message: "Case not found." };
  }
  if (record.organization.planStatus === "active") {
    return { allowed: true, message: "Agency plan is active." };
  }
  if (paymentGrantsAccess(record.payment?.status)) {
    return { allowed: true, message: "Packet fee is recorded." };
  }
  const message = stripeConfigured()
    ? "Pay the packet fee for this case before running a scan or exporting the packet. An active agency plan covers every case."
    : "Record the packet fee for this case before running a scan or exporting the packet. Stripe is not configured, so the billing button stores a practice payment and does not charge a card.";
  return { allowed: false, message };
}
