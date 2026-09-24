import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addChangelog } from "@/lib/changelog";
import { runSiteScan } from "@/lib/scan";
import { replaceCaseScan } from "@/lib/save-scan";
import { packetAccessForCase } from "@/lib/access";
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

  const access = await packetAccessForCase(id, session.user.organizationId);
  if (!access.allowed) {
    return NextResponse.json({ error: access.message, paywall: true }, { status: 402 });
  }

  try {
    const extraUrls = safeJsonParse<string[]>(record.demandLetter?.listedUrls, []);
    const result = await runSiteScan({
      homepage: record.siteUrl,
      extraUrls,
      caseId: id,
    });

    await replaceCaseScan(id, result);
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
    await prisma.scan.create({
      data: { caseId: id, status: "failed", completedAt: new Date(), error: message },
    });
    await prisma.case.update({ where: { id }, data: { status: "intake" } });
    await addChangelog(id, `Scan failed: ${message}`, session.user.name);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
