import { prisma } from "@/lib/prisma";
import { PACKET_DISCLAIMER } from "@/lib/constants";
import { safeJsonParse } from "@/lib/utils";

export async function buildPacketPayload(caseId: string, organizationId: string) {
  const record = await prisma.case.findFirst({
    where: { id: caseId, organizationId },
    include: {
      organization: true,
      demandLetter: true,
      scans: { orderBy: { startedAt: "desc" } },
      issues: { orderBy: [{ severity: "asc" }, { pageUrl: "asc" }] },
      changelog: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!record) return null;

  const latestScan = record.scans[0] ?? null;
  const allegedIssues = safeJsonParse<string[]>(record.demandLetter?.allegedIssues, []);
  const listedUrls = safeJsonParse<string[]>(record.demandLetter?.listedUrls, []);

  return {
    generatedAt: new Date().toISOString(),
    disclaimer: PACKET_DISCLAIMER,
    organization: {
      name: record.organization.name,
    },
    case: {
      id: record.id,
      clientName: record.clientName,
      clientEmail: record.clientEmail,
      siteUrl: record.siteUrl,
      status: record.status,
      deadlineAt: record.deadlineAt?.toISOString() ?? null,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
    },
    letter: record.demandLetter
      ? {
          sender: record.demandLetter.sender,
          dateReceived: record.demandLetter.dateReceived?.toISOString() ?? null,
          allegedIssues,
          listedUrls,
          notes: record.demandLetter.notes,
        }
      : null,
    scan: latestScan
      ? {
          id: latestScan.id,
          startedAt: latestScan.startedAt.toISOString(),
          completedAt: latestScan.completedAt?.toISOString() ?? null,
          pagesScanned: latestScan.pagesScanned,
          status: latestScan.status,
          summary: safeJsonParse(latestScan.summaryJson, null),
          pages: safeJsonParse<string[]>(latestScan.pagesJson, []),
        }
      : null,
    issues: record.issues.map((issue) => ({
      id: issue.id,
      pageUrl: issue.pageUrl,
      severity: issue.severity,
      wcagRule: issue.wcagRule,
      ruleId: issue.ruleId,
      help: issue.help,
      description: issue.description,
      selector: issue.selector,
      snippet: issue.snippet,
      status: issue.status,
      beforeNotes: issue.beforeNotes,
      afterNotes: issue.afterNotes,
      fixedAt: issue.fixedAt?.toISOString() ?? null,
    })),
    changelog: record.changelog.map((entry) => ({
      at: entry.createdAt.toISOString(),
      author: entry.authorName,
      message: entry.message,
    })),
    counts: {
      total: record.issues.length,
      open: record.issues.filter((issue) => issue.status === "open").length,
      inProgress: record.issues.filter((issue) => issue.status === "in_progress").length,
      fixed: record.issues.filter((issue) => issue.status === "fixed").length,
      wontFix: record.issues.filter((issue) => issue.status === "wont_fix").length,
    },
  };
}

export type PacketPayload = NonNullable<Awaited<ReturnType<typeof buildPacketPayload>>>;
