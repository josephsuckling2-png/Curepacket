import { prisma } from "@/lib/prisma";
import {
  sendMonitoringAlertEmail,
  sendPacketReadyEmail,
  sendPaymentReceiptEmail,
} from "@/lib/mail";

export async function organizationEmails(organizationId: string) {
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: { email: true, role: true },
  });
  const owners = users.filter((user) => user.role === "owner").map((user) => user.email);
  return owners.length ? owners : users.map((user) => user.email);
}

export async function addNotification(options: {
  organizationId: string;
  kind: string;
  title: string;
  body: string;
}) {
  return prisma.notification.create({ data: options });
}

export async function notifyPacketFee(options: {
  organizationId: string;
  caseId: string;
  clientName: string;
  amountCents: number;
  practice: boolean;
}) {
  const dollars = (options.amountCents / 100).toFixed(2);
  const body = options.practice
    ? `Practice payment of $${dollars} recorded for ${options.clientName}. Scans and packet export are unlocked for this case. No card was charged.`
    : `Payment of $${dollars} recorded for ${options.clientName}. Scans and packet export are unlocked for this case.`;
  await addNotification({
    organizationId: options.organizationId,
    kind: "payment",
    title: options.practice ? "Practice payment recorded" : "Payment received",
    body,
  });
  const to = await organizationEmails(options.organizationId);
  await sendPaymentReceiptEmail({
    to,
    clientName: options.clientName,
    amountCents: options.amountCents,
    practice: options.practice,
  });
}

export async function notifyPacketReady(options: {
  organizationId: string;
  caseId: string;
  clientName: string;
}) {
  await addNotification({
    organizationId: options.organizationId,
    kind: "packet_ready",
    title: "Packet ready",
    body: `The evidence packet for ${options.clientName} can be downloaded.`,
  });
  const to = await organizationEmails(options.organizationId);
  await sendPacketReadyEmail({ to, clientName: options.clientName, caseId: options.caseId });
}

export async function notifyMonitoringAlert(options: {
  organizationId: string;
  siteUrl: string;
  findings: { severity: string; help: string; pageUrl: string }[];
}) {
  const preview = options.findings
    .slice(0, 8)
    .map((finding) => `${finding.severity}: ${finding.help}`)
    .join("\n");
  const body = `New critical or serious automated findings on ${options.siteUrl}.\n${preview}`;
  console.log(`[monitoring] ${body}`);
  await addNotification({
    organizationId: options.organizationId,
    kind: "monitoring_alert",
    title: "New monitoring findings",
    body,
  });
  const to = await organizationEmails(options.organizationId);
  await sendMonitoringAlertEmail({ to, siteUrl: options.siteUrl, findings: options.findings });
}
