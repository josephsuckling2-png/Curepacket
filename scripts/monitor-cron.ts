import { prisma } from "../src/lib/prisma";
import { runSiteScan } from "../src/lib/scan";
import { replaceCaseScan, seriousFindingKey } from "../src/lib/save-scan";
import { addChangelog } from "../src/lib/changelog";
import { addNotification, notifyMonitoringAlert } from "../src/lib/notify";
import { safeJsonParse } from "../src/lib/utils";

async function main() {
  const subscriptions = await prisma.monitoringSubscription.findMany({
    where: { status: "active" },
    include: { case: { include: { demandLetter: true } } },
  });

  console.log(`Monitoring cron: ${subscriptions.length} active subscription(s).`);
  if (!subscriptions.length) return;

  for (const subscription of subscriptions) {
    const siteUrl = subscription.siteUrl?.trim();
    if (!siteUrl) {
      console.log(`Skipping ${subscription.id}: no site URL.`);
      continue;
    }

    try {
      const caseId = await ensureCase(subscription.id, subscription.organizationId, subscription.caseId, siteUrl);
      const previous = await prisma.issue.findMany({
        where: { caseId, severity: { in: ["critical", "serious"] } },
        select: { severity: true, ruleId: true, pageUrl: true, selector: true },
      });
      const seen = new Set(previous.map((issue) => seriousFindingKey(issue)));
      const extraUrls = safeJsonParse<string[]>(subscription.case?.demandLetter?.listedUrls, []);
      const result = await runSiteScan({ homepage: siteUrl, extraUrls, caseId });
      await replaceCaseScan(caseId, result);
      await prisma.monitoringSubscription.update({
        where: { id: subscription.id },
        data: { lastScannedAt: new Date(), caseId },
      });
      await addChangelog(
        caseId,
        `Monthly monitoring scan stored ${result.summary.pagesScanned} pages and ${result.summary.issueCount} findings.`,
        "Monitor",
      );

      const fresh = result.issues.filter(
        (issue) =>
          (issue.severity === "critical" || issue.severity === "serious") && !seen.has(seriousFindingKey(issue)),
      );
      if (!fresh.length) {
        console.log(`No new critical or serious issues for ${siteUrl}.`);
        continue;
      }

      console.log(`${fresh.length} new critical/serious issue(s) for ${siteUrl}.`);
      await notifyMonitoringAlert({
        organizationId: subscription.organizationId,
        siteUrl,
        findings: fresh.map((issue) => ({
          severity: issue.severity,
          help: issue.help,
          pageUrl: issue.pageUrl,
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Monitoring scan failed.";
      console.error(`Monitoring scan failed for ${siteUrl}: ${message}`);
      await addNotification({
        organizationId: subscription.organizationId,
        kind: "monitoring_alert",
        title: "Monitoring scan failed",
        body: `${siteUrl}: ${message}`,
      });
    }
  }
}

async function ensureCase(subscriptionId: string, organizationId: string, caseId: string | null, siteUrl: string) {
  if (caseId) {
    const existing = await prisma.case.findFirst({ where: { id: caseId, organizationId } });
    if (existing) return existing.id;
  }

  let hostname = siteUrl;
  try {
    hostname = new URL(siteUrl).hostname;
  } catch {
    hostname = siteUrl;
  }
  const created = await prisma.case.create({
    data: {
      organizationId,
      clientName: `Monitoring · ${hostname}`,
      siteUrl,
      status: "scanning",
      notes: "Opened automatically for a monitoring subscription that had no case.",
    },
  });
  await prisma.monitoringSubscription.update({
    where: { id: subscriptionId },
    data: { caseId: created.id },
  });
  return created.id;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
