"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/auth";
import { addChangelog } from "@/lib/changelog";
import { extractLetter } from "@/lib/extract-letter";
import { CASE_STATUSES, ISSUE_STATUSES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { mailConfigured, sendVerificationEmail, sendWelcomeEmail } from "@/lib/mail";
import { createVerificationToken } from "@/lib/verification";

async function orgId() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }
  return session;
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organization: z.string().min(2),
});

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organization: formData.get("organization"),
  });
  if (!parsed.success) {
    return { error: "Please complete all fields (password 8+ characters)." };
  }

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "An account with that email already exists." };
  }

  const organization = await prisma.organization.create({
    data: {
      name: parsed.data.organization,
      slug: `${slugify(parsed.data.organization)}-${Math.random().toString(36).slice(2, 6)}`,
      planStatus: "none",
    },
  });

  const verification = mailConfigured() ? createVerificationToken() : null;
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: "owner",
      organizationId: organization.id,
      emailVerified: verification ? null : new Date(),
      verifyTokenHash: verification?.hash,
      verifyTokenExpires: verification?.expires,
    },
  });

  if (verification) {
    const sent = await sendVerificationEmail(email, verification.token);
    if (sent.sent) {
      return {
        needsVerification: true as const,
        message: "Check your email for a confirmation link. You can sign in after you confirm.",
      };
    }
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date(), verifyTokenHash: null, verifyTokenExpires: null },
    });
  }

  await sendWelcomeEmail(email, parsed.data.name);
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
}

export async function createCaseAction(formData: FormData) {
  const session = await orgId();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const siteUrl = String(formData.get("siteUrl") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const deadlineAt = String(formData.get("deadlineAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientName || !siteUrl) {
    return { error: "Client name and site URL are required." };
  }

  const record = await prisma.case.create({
    data: {
      organizationId: session.user.organizationId,
      clientName,
      siteUrl,
      clientEmail: clientEmail || null,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      notes: notes || null,
      status: "intake",
    },
  });

  await addChangelog(record.id, "Case opened.", session.user.name);
  revalidatePath("/cases");
  redirect(`/cases/${record.id}/intake`);
}

export async function updateCaseAction(caseId: string, formData: FormData) {
  const session = await orgId();
  const status = String(formData.get("status") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const siteUrl = String(formData.get("siteUrl") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const deadlineAt = String(formData.get("deadlineAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!CASE_STATUSES.includes(status as (typeof CASE_STATUSES)[number])) {
    return { error: "Invalid status." };
  }

  await prisma.case.updateMany({
    where: { id: caseId, organizationId: session.user.organizationId },
    data: {
      status,
      clientName,
      siteUrl,
      clientEmail: clientEmail || null,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      notes: notes || null,
    },
  });

  await addChangelog(caseId, `Case details updated. Status set to ${status}.`, session.user.name);
  revalidatePath(`/cases/${caseId}`);
  return { ok: true };
}

export async function deleteCaseAction(caseId: string) {
  const session = await orgId();
  await prisma.case.deleteMany({
    where: { id: caseId, organizationId: session.user.organizationId },
  });
  revalidatePath("/cases");
  redirect("/cases");
}

export async function saveIntakeAction(caseId: string, formData: FormData) {
  const session = await orgId();
  const owned = await prisma.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
  });
  if (!owned) return { error: "Case not found." };

  const sender = String(formData.get("sender") ?? "").trim();
  const dateReceived = String(formData.get("dateReceived") ?? "").trim();
  const allegedIssues = String(formData.get("allegedIssues") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const listedUrls = String(formData.get("listedUrls") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const notes = String(formData.get("notes") ?? "").trim();
  const rawText = String(formData.get("rawText") ?? "").trim();

  await prisma.demandLetter.upsert({
    where: { caseId },
    update: {
      sender: sender || null,
      dateReceived: dateReceived ? new Date(dateReceived) : null,
      allegedIssues: JSON.stringify(allegedIssues),
      listedUrls: JSON.stringify(listedUrls),
      notes: notes || null,
      rawText: rawText || null,
    },
    create: {
      caseId,
      sender: sender || null,
      dateReceived: dateReceived ? new Date(dateReceived) : null,
      allegedIssues: JSON.stringify(allegedIssues),
      listedUrls: JSON.stringify(listedUrls),
      notes: notes || null,
      rawText: rawText || null,
    },
  });

  await addChangelog(caseId, "Demand-letter intake saved.", session.user.name);
  revalidatePath(`/cases/${caseId}`);
  return { ok: true };
}

export async function extractIntakeAction(caseId: string, rawText: string) {
  const session = await orgId();
  const owned = await prisma.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
  });
  if (!owned) return { error: "Case not found." };

  const extracted = await extractLetter(rawText);
  await prisma.demandLetter.upsert({
    where: { caseId },
    update: {
      rawText,
      sender: extracted.sender,
      dateReceived: extracted.dateReceived ? new Date(extracted.dateReceived) : undefined,
      allegedIssues: JSON.stringify(extracted.allegedIssues),
      listedUrls: JSON.stringify(extracted.listedUrls),
      notes: extracted.notes,
      extractedAt: new Date(),
    },
    create: {
      caseId,
      rawText,
      sender: extracted.sender,
      dateReceived: extracted.dateReceived ? new Date(extracted.dateReceived) : null,
      allegedIssues: JSON.stringify(extracted.allegedIssues),
      listedUrls: JSON.stringify(extracted.listedUrls),
      notes: extracted.notes,
      extractedAt: new Date(),
    },
  });

  await addChangelog(
    caseId,
    extracted.usedLlm
      ? "Letter text extracted with optional LLM assist."
      : "Letter text extracted with local heuristics.",
    session.user.name,
  );
  revalidatePath(`/cases/${caseId}/intake`);
  return { ok: true, extracted };
}

export async function updateIssueAction(
  caseId: string,
  issueId: string,
  input: {
    status?: string;
    beforeNotes?: string;
    afterNotes?: string;
  },
) {
  const session = await orgId();
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, case: { id: caseId, organizationId: session.user.organizationId } },
  });
  if (!issue) return { error: "Issue not found." };

  if (input.status && !ISSUE_STATUSES.includes(input.status as (typeof ISSUE_STATUSES)[number])) {
    return { error: "Invalid issue status." };
  }

  const nextStatus = input.status ?? issue.status;
  await prisma.issue.update({
    where: { id: issueId },
    data: {
      status: nextStatus,
      beforeNotes: input.beforeNotes ?? issue.beforeNotes,
      afterNotes: input.afterNotes ?? issue.afterNotes,
      fixedAt: nextStatus === "fixed" ? new Date() : nextStatus === issue.status ? issue.fixedAt : null,
    },
  });

  if (input.status && input.status !== issue.status) {
    await addChangelog(caseId, `Issue ${issue.ruleId} marked ${input.status}.`, session.user.name);
  } else {
    await addChangelog(caseId, `Updated proof notes for ${issue.ruleId}.`, session.user.name);
  }

  const remaining = await prisma.issue.count({
    where: { caseId, status: { in: ["open", "in_progress"] } },
  });
  if (remaining === 0) {
    await prisma.case.update({ where: { id: caseId }, data: { status: "packet_ready" } });
  } else if (nextStatus === "in_progress" || nextStatus === "fixed") {
    const current = await prisma.case.findUnique({ where: { id: caseId } });
    if (current && (current.status === "intake" || current.status === "scanning")) {
      await prisma.case.update({ where: { id: caseId }, data: { status: "remediating" } });
    }
  }

  revalidatePath(`/cases/${caseId}/board`);
  revalidatePath(`/cases/${caseId}/packet`);
  return { ok: true };
}

export async function addManualChangelogAction(caseId: string, formData: FormData) {
  const session = await orgId();
  const owned = await prisma.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
  });
  if (!owned) return { error: "Case not found." };
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Changelog message is required." };
  await addChangelog(caseId, message, session.user.name);
  revalidatePath(`/cases/${caseId}/packet`);
  return { ok: true };
}

export async function updateOrgSettingsAction(formData: FormData) {
  const session = await orgId();
  const name = String(formData.get("name") ?? "").trim();
  const packetFee = Number(formData.get("packetFee") ?? 750);
  if (!name) return { error: "Organization name is required." };
  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      name,
      packetFeeCents: Math.round(packetFee * 100),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/billing");
  return { ok: true };
}
