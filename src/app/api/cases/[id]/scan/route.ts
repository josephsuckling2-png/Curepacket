import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { runSiteScan } from "@/lib/scan";
import { safeJsonParse } from "@/lib/utils";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await prisma.case.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { demandLetter: true },
  });
  if (!record) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  await prisma.case.update({ where: { id }, data: { status: "scanning" } });
  const scan = await prisma.scan.create({
    data: { caseId: id, status: "running" },
  });

  try {
    const extraUrls = safeJsonParse<string[]>(record.demandLetter?.listedUrls, []);
    const result = await runSiteScan({
      homepage: record.siteUrl,
      extraUrls,
      caseId: id,
    });

    await prisma.issue.deleteMany({ where: { caseId: id, scanId: { not: null } } });
    if (result.issues.length) {
      await prisma.issue.createMany({
        data: result.issues.map((issue) => ({
          caseId: id,
          scanId: scan.id,
          ...issue,
        })),
      });
    }

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        pagesScanned: result.pages.length,
        pagesJson: JSON.stringify(result.pages),
        summaryJson: JSON.stringify(result.summary),
      },
    });

    await prisma.case.update({
      where: { id },
      data: { status: result.issues.length ? "remediating" : "packet_ready" },
    });
    await addChangelog(
      id,
      `Scan completed: ${result.pages.length} pages, ${result.issues.length} automated findings.`,
      session.user.name,
    );

    return NextResponse.json({
      ok: true,
      pagesScanned: result.pages.length,
      issueCount: result.issues.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    await prisma.scan.update({
      where: { id: scan.id },
      data: { status: "failed", completedAt: new Date(), error: message },
    });
    await prisma.case.update({ where: { id }, data: { status: "intake" } });
    await addChangelog(id, `Scan failed: ${message}`, session.user.name);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
