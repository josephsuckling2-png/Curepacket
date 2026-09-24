import { appBaseUrl } from "@/lib/app-url";
import { PACKET_DISCLAIMER } from "@/lib/constants";

export function mailConfigured() {
  return Boolean(mailApiKey());
}

function mailApiKey() {
  return process.env.RESEND_API_KEY?.trim() || process.env.AUTH_RESEND_KEY?.trim() || "";
}

function mailFrom() {
  return process.env.EMAIL_FROM?.trim() || "CurePacket <onboarding@resend.dev>";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEmail(options: { to: string | string[]; subject: string; text: string; html?: string }) {
  const key = mailApiKey();
  const recipients = (Array.isArray(options.to) ? options.to : [options.to]).filter(Boolean);
  if (!key || recipients.length === 0) {
    console.log(`[email skipped] to=${recipients.join(",") || "(none)"} subject=${options.subject}`);
    return { sent: false as const, skipped: true as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: mailFrom(),
        to: recipients,
        subject: options.subject,
        text: options.text,
        html: options.html ?? `<pre>${escapeHtml(options.text)}</pre>`,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`[email failed] ${response.status} ${body}`);
      return { sent: false as const, skipped: false as const };
    }
    return { sent: true as const, skipped: false as const };
  } catch (error) {
    console.error("[email failed]", error);
    return { sent: false as const, skipped: false as const };
  }
}

function wrap(title: string, paragraphs: string[], link?: { href: string; label: string }) {
  const body = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const button = link
    ? `<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>`
    : "";
  return `<div>${body}${button}<p>${escapeHtml(PACKET_DISCLAIMER)}</p><p>${escapeHtml(title)}</p></div>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const url = `${appBaseUrl()}/dashboard`;
  const text = `Welcome to CurePacket, ${name}.\n\nYour agency workspace is ready. Open the desk: ${url}\n\n${PACKET_DISCLAIMER}`;
  return sendEmail({
    to,
    subject: "Welcome to CurePacket",
    text,
    html: wrap("Welcome to CurePacket", [`Welcome to CurePacket, ${name}.`, "Your agency workspace is empty and ready for a real client."], {
      href: url,
      label: "Open the desk",
    }),
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const text = `Confirm your CurePacket email.\n\nOpen this link within 48 hours:\n${url}\n\nIf you did not create an account, you can ignore this message.`;
  return sendEmail({
    to,
    subject: "Confirm your CurePacket email",
    text,
    html: wrap(
      "Confirm your email",
      ["Confirm your email to finish creating the agency workspace. The link expires in 48 hours."],
      { href: url, label: "Confirm email" },
    ),
  });
}

export async function sendPaymentReceiptEmail(options: {
  to: string[];
  clientName: string;
  amountCents: number;
  practice: boolean;
}) {
  const url = `${appBaseUrl()}/billing`;
  const dollars = (options.amountCents / 100).toFixed(2);
  const lead = options.practice
    ? `A practice payment of $${dollars} was recorded for ${options.clientName}. No card was charged because Stripe is not configured.`
    : `Payment of $${dollars} was recorded for the ${options.clientName} packet fee.`;
  const text = `${lead}\n\nBilling desk: ${url}\n\n${PACKET_DISCLAIMER}`;
  return sendEmail({
    to: options.to,
    subject: options.practice ? `Practice payment recorded — ${options.clientName}` : `Payment received — ${options.clientName}`,
    text,
    html: wrap(options.practice ? "Practice payment" : "Payment received", [lead], {
      href: url,
      label: "Open billing",
    }),
  });
}

export async function sendPacketReadyEmail(options: { to: string[]; clientName: string; caseId: string }) {
  const url = `${appBaseUrl()}/cases/${options.caseId}/packet`;
  const text = `The evidence packet for ${options.clientName} is ready to download.\n\n${url}\n\n${PACKET_DISCLAIMER}`;
  return sendEmail({
    to: options.to,
    subject: `Packet ready — ${options.clientName}`,
    text,
    html: wrap("Packet ready", [`The evidence packet for ${options.clientName} is ready to download.`], {
      href: url,
      label: "Open the packet",
    }),
  });
}

export async function sendMonitoringAlertEmail(options: {
  to: string[];
  siteUrl: string;
  findings: { severity: string; help: string; pageUrl: string }[];
}) {
  const lines = options.findings
    .slice(0, 15)
    .map((finding) => `- ${finding.severity}: ${finding.help} (${finding.pageUrl})`);
  const extra = options.findings.length > 15 ? `\n…and ${options.findings.length - 15} more.` : "";
  const text = `New critical or serious automated findings on ${options.siteUrl}.\n\n${lines.join("\n")}${extra}\n\nThese are scanner results, not a legal conclusion.\n\n${PACKET_DISCLAIMER}`;
  return sendEmail({
    to: options.to,
    subject: `New findings on ${options.siteUrl}`,
    text,
    html: wrap(
      "Monitoring alert",
      [
        `New critical or serious automated findings on ${options.siteUrl}.`,
        ...options.findings.slice(0, 15).map((finding) => `${finding.severity}: ${finding.help} — ${finding.pageUrl}`),
        options.findings.length > 15 ? `And ${options.findings.length - 15} more in the desk.` : "",
        "These are scanner results, not a legal conclusion.",
      ].filter(Boolean),
      { href: `${appBaseUrl()}/dashboard`, label: "Open the desk" },
    ),
  });
}
