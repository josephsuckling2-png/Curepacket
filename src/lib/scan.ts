import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { rewriteFixtureUrl } from "@/lib/fixture-url";
import { screenshotDirectory } from "@/lib/screenshots";
import { normalizeUrl, originOf } from "@/lib/utils";

export type ScanIssueInput = {
  pageUrl: string;
  severity: string;
  wcagRule: string | null;
  ruleId: string;
  help: string;
  helpUrl: string | null;
  description: string | null;
  selector: string | null;
  snippet: string | null;
  beforeScreenshot: string | null;
};

export type ScanResult = {
  pages: string[];
  issues: ScanIssueInput[];
  summary: {
    pagesScanned: number;
    issueCount: number;
    bySeverity: Record<string, number>;
  };
};

const MAX_LINKED_PAGES = 25;
const NAV_TIMEOUT_MS = 20000;

function sameOrigin(url: string, origin: string) {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function collectWcag(tags: string[]) {
  const wcag = tags
    .filter((tag) => /^wcag\d+/i.test(tag))
    .map((tag) => {
      const digits = tag.replace(/[^0-9]/g, "");
      if (digits.length >= 3) {
        return `${digits[0]}.${digits[1]}.${digits.slice(2)}`;
      }
      return tag;
    });
  return wcag[0] ?? null;
}

export async function runSiteScan(options: {
  homepage: string;
  extraUrls?: string[];
  caseId: string;
}): Promise<ScanResult> {
  const origin = originOf(options.homepage);
  if (!origin) {
    throw new Error("Site URL is not valid.");
  }

  let chromium;
  let AxeBuilder;
  try {
    ({ chromium } = await import("playwright"));
    ({ default: AxeBuilder } = await import("@axe-core/playwright"));
  } catch {
    throw new Error(
      "Playwright or axe-core is not available. Run npm install, then npx playwright install chromium.",
    );
  }

  let browser;
  try {
    const args = ["--disable-dev-shm-usage"];
    if (process.env.PLAYWRIGHT_NO_SANDBOX === "1" || process.env.PLAYWRIGHT_NO_SANDBOX === "true") {
      args.push("--no-sandbox", "--disable-setuid-sandbox");
    }
    browser = await chromium.launch({ headless: true, args });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown browser launch error";
    throw new Error(
      `Could not launch Chromium. Install browsers with: npx playwright install chromium. (${message})`,
    );
  }

  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const queue: string[] = [];
  const seen = new Set<string>();
  const pages: string[] = [];
  const issues: ScanIssueInput[] = [];
  const screenshotDir = screenshotDirectory(options.caseId);
  await mkdir(screenshotDir, { recursive: true });

  const enqueue = (raw: string, base?: string) => {
    const normalized = normalizeUrl(raw, base);
    if (!normalized || seen.has(normalized)) return;
    if (!sameOrigin(normalized, origin)) return;
    if (!/^https?:/i.test(normalized)) return;
    seen.add(normalized);
    queue.push(normalized);
  };

  enqueue(rewriteFixtureUrl(options.homepage));
  for (const extra of options.extraUrls ?? []) {
    enqueue(rewriteFixtureUrl(extra));
  }

  try {
    while (queue.length && pages.length < MAX_LINKED_PAGES + 1) {
      const url = queue.shift();
      if (!url) break;

      try {
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: NAV_TIMEOUT_MS,
        });
        if (!response || response.status() >= 400) {
          continue;
        }
        pages.push(url);

        if (pages.length === 1) {
          const hrefs = await page.$$eval("a[href]", (anchors) =>
            anchors.map((anchor) => (anchor as HTMLAnchorElement).href),
          );
          for (const href of hrefs) {
            if (pages.length + queue.length >= MAX_LINKED_PAGES + 1) break;
            enqueue(href, url);
          }
        }

        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        let screenshotIndex = 0;
        for (const violation of axe.violations) {
          for (const node of violation.nodes.slice(0, 4)) {
            let screenshotPath: string | null = null;
            try {
              const handle = await page.$(node.target[0] as string);
              if (handle && screenshotIndex < 8) {
                const file = `${pages.length}-${screenshotIndex}-${violation.id}.png`;
                const full = path.join(screenshotDir, file);
                await handle.screenshot({ path: full, timeout: 3000 });
                screenshotPath = `/api/files/screenshots/${options.caseId}/${file}`;
                screenshotIndex += 1;
              }
            } catch {
              screenshotPath = null;
            }

            issues.push({
              pageUrl: url,
              severity: violation.impact ?? "moderate",
              wcagRule: collectWcag(violation.tags),
              ruleId: violation.id,
              help: violation.help,
              helpUrl: violation.helpUrl ?? null,
              description: violation.description,
              selector: (node.target ?? []).join(" "),
              snippet: node.html?.slice(0, 400) ?? null,
              beforeScreenshot: screenshotPath,
            });
          }
        }
      } catch {
        continue;
      }
    }
  } finally {
    await browser.close();
  }

  if (!pages.length) {
    throw new Error(
      "Scan reached no pages. Check the site URL, network access, and that Playwright Chromium is installed.",
    );
  }

  const bySeverity: Record<string, number> = {};
  for (const issue of issues) {
    bySeverity[issue.severity] = (bySeverity[issue.severity] ?? 0) + 1;
  }

  const summary = {
    pagesScanned: pages.length,
    issueCount: issues.length,
    bySeverity,
  };

  await writeFile(
    path.join(screenshotDir, "summary.json"),
    JSON.stringify({ pages, summary }, null, 2),
  );

  return { pages, issues, summary };
}
