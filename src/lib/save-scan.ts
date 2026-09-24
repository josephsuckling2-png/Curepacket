import { prisma } from "@/lib/prisma";
import type { ScanResult } from "@/lib/scan";

export async function replaceCaseScan(caseId: string, result: ScanResult) {
  const scan = await prisma.scan.create({
    data: {
      caseId,
      status: "completed",
      completedAt: new Date(),
      pagesScanned: result.pages.length,
      pagesJson: JSON.stringify(result.pages),
      summaryJson: JSON.stringify(result.summary),
    },
  });

  await prisma.issue.deleteMany({ where: { caseId, scanId: { not: null } } });
  if (result.issues.length) {
    await prisma.issue.createMany({
      data: result.issues.map((issue) => ({
        caseId,
        scanId: scan.id,
        ...issue,
      })),
    });
  }

  await prisma.case.update({
    where: { id: caseId },
    data: { status: result.issues.length ? "remediating" : "packet_ready" },
  });

  return scan;
}

export function seriousFindingKey(issue: { severity: string; ruleId?: string | null; pageUrl: string; selector?: string | null }) {
  return `${issue.severity}|${issue.ruleId ?? ""}|${issue.pageUrl}|${issue.selector ?? ""}`;
}
