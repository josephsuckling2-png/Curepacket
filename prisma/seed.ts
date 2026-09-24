import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fixturePageUrl } from "../src/lib/fixture-url";

const prisma = new PrismaClient();
const homeUrl = fixturePageUrl("index.html");
const cartUrl = fixturePageUrl("cart.html");
const contactUrl = fixturePageUrl("contact.html");

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const organization = await prisma.organization.upsert({
    where: { slug: "harbor-and-co" },
    update: { name: "Harbor & Co. Digital", packetFeeCents: 75000 },
    create: {
      name: "Harbor & Co. Digital",
      slug: "harbor-and-co",
      packetFeeCents: 75000,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo@curepacket.dev" },
    update: {
      name: "Avery Chen",
      passwordHash,
      role: "owner",
      organizationId: organization.id,
    },
    create: {
      email: "demo@curepacket.dev",
      name: "Avery Chen",
      passwordHash,
      role: "owner",
      organizationId: organization.id,
    },
  });

  const northwind = await prisma.case.upsert({
    where: { id: "case_northwind_demo" },
    update: { siteUrl: homeUrl },
    create: {
      id: "case_northwind_demo",
      organizationId: organization.id,
      clientName: "Northwind Provisions",
      clientEmail: "ops@northwind-provisions.example",
      siteUrl: homeUrl,
      status: "remediating",
      deadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 41),
      notes: "E-commerce client received a serial demand letter naming homepage, cart, and contact.",
    },
  });

  await prisma.demandLetter.upsert({
    where: { caseId: northwind.id },
    update: { listedUrls: JSON.stringify([homeUrl, cartUrl, contactUrl]) },
    create: {
      caseId: northwind.id,
      sender: "Reed & Feldman LLP",
      dateReceived: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      allegedIssues: JSON.stringify([
        "Images missing alternative text",
        "Insufficient color contrast",
        "Form controls without labels",
        "Alleged WCAG 1.1.1",
        "Alleged WCAG 1.4.3",
        "Alleged WCAG 1.3.1",
      ]),
      listedUrls: JSON.stringify([homeUrl, cartUrl, contactUrl]),
      notes: "Letter cites homepage hero, checkout CTA, and contact form. Client wants a counsel packet in 45 days.",
      rawText: `REED & FELDMAN LLP
September 7, 2026

Re: Accessibility barriers at https://northwind.example

Our client alleges that ${homeUrl}, ${cartUrl}, and ${contactUrl} contain images missing alternative text, insufficient color contrast, and form controls without labels, including WCAG 1.1.1, 1.4.3, and 1.3.1.`,
      extractedAt: new Date(),
    },
  });

  const scan = await prisma.scan.upsert({
    where: { id: "scan_northwind_demo" },
    update: {},
    create: {
      id: "scan_northwind_demo",
      caseId: northwind.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5.8),
      status: "completed",
      pagesScanned: 3,
      pagesJson: JSON.stringify([homeUrl, cartUrl, contactUrl]),
      summaryJson: JSON.stringify({
        pagesScanned: 3,
        issueCount: 8,
        bySeverity: { critical: 2, serious: 3, moderate: 2, minor: 1 },
      }),
    },
  });

  const existingIssues = await prisma.issue.count({ where: { caseId: northwind.id } });
  if (existingIssues === 0) {
    await prisma.issue.createMany({
      data: [
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: homeUrl,
          severity: "critical",
          wcagRule: "1.1.1",
          ruleId: "image-alt",
          help: "Images must have alternate text",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.10/image-alt",
          description: "Hero product image has no alt attribute.",
          selector: "img.hero-photo",
          snippet: '<img class="hero-photo" src="/fixtures/demo-site/oil.jpg">',
          status: "in_progress",
          beforeNotes: "Hero image decorative? Confirm with designer. Currently empty alt missing entirely.",
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: homeUrl,
          severity: "serious",
          wcagRule: "1.4.3",
          ruleId: "color-contrast",
          help: "Elements must meet minimum color contrast ratio thresholds",
          description: "Footer links are #A38B74 on #F4EFE4 (approx 2.4:1).",
          selector: "footer a.muted-link",
          snippet: '<a class="muted-link" href="/privacy">Privacy</a>',
          status: "open",
          beforeNotes: "Replace with ink #0c1a22 on parchment.",
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: cartUrl,
          severity: "critical",
          wcagRule: "4.1.2",
          ruleId: "button-name",
          help: "Buttons must have discernible text",
          description: "Quantity stepper uses icon-only buttons without accessible names.",
          selector: "button.qty-plus",
          snippet: '<button class="qty-plus"></button>',
          status: "open",
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: contactUrl,
          severity: "serious",
          wcagRule: "1.3.1",
          ruleId: "label",
          help: "Form elements must have labels",
          description: "Email input has placeholder only.",
          selector: "input[name='email']",
          snippet: '<input name="email" placeholder="Email">',
          status: "fixed",
          beforeNotes: "Placeholder-only field.",
          afterNotes: "Added visible label and id/for pairing. Placeholder kept as example only.",
          fixedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: homeUrl,
          severity: "serious",
          wcagRule: "2.4.4",
          ruleId: "link-name",
          help: "Links must have discernible text",
          description: "Card CTA is an empty anchor wrapping an icon.",
          selector: "a.card-arrow",
          snippet: '<a class="card-arrow" href="/shop"></a>',
          status: "open",
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: cartUrl,
          severity: "moderate",
          wcagRule: "1.3.1",
          ruleId: "heading-order",
          help: "Heading levels should only increase by one",
          description: "Page jumps from h1 to h4 on the order summary.",
          selector: "h4.summary-title",
          snippet: "<h4 class=\"summary-title\">Order summary</h4>",
          status: "open",
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: contactUrl,
          severity: "moderate",
          wcagRule: "3.3.2",
          ruleId: "select-name",
          help: "Select element must have an accessible name",
          description: "Reason-for-contact dropdown is unlabeled.",
          selector: "select#reason",
          snippet: '<select id="reason"><option>Wholesale</option></select>',
          status: "open",
        },
        {
          caseId: northwind.id,
          scanId: scan.id,
          pageUrl: homeUrl,
          severity: "minor",
          wcagRule: "2.4.1",
          ruleId: "bypass",
          help: "Page should have a skip-link or landmark structure",
          description: "No skip-to-content link present.",
          selector: "html",
          snippet: "<html lang=\"en\">",
          status: "wont_fix",
          beforeNotes: "Will add skip link in the theme update next sprint; documented as deferred.",
        },
      ],
    });
  }

  const changelogCount = await prisma.changelogEntry.count({ where: { caseId: northwind.id } });
  if (changelogCount === 0) {
    await prisma.changelogEntry.createMany({
      data: [
        {
          caseId: northwind.id,
          authorName: "Avery Chen",
          message: "Opened case from demand letter dated 7 Sep 2026.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        },
        {
          caseId: northwind.id,
          authorName: "System",
          message: "Completed seeded scan of 3 named pages (8 issues).",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        },
        {
          caseId: northwind.id,
          authorName: "Sam Okonkwo",
          message: "Marked contact email label as fixed after theme patch.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
      ],
    });
  }

  await prisma.payment.upsert({
    where: { caseId: northwind.id },
    update: {},
    create: {
      caseId: northwind.id,
      amountCents: 75000,
      status: "unpaid",
      kind: "packet",
    },
  });

  const dental = await prisma.case.upsert({
    where: { id: "case_cedar_demo" },
    update: {},
    create: {
      id: "case_cedar_demo",
      organizationId: organization.id,
      clientName: "Cedar Street Dental",
      clientEmail: "hello@cedarstreetdental.example",
      siteUrl: "https://cedarstreetdental.example",
      status: "intake",
      deadlineAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 67),
      notes: "New patient-site letter. Intake in progress; scan not run.",
    },
  });

  await prisma.demandLetter.upsert({
    where: { caseId: dental.id },
    update: {},
    create: {
      caseId: dental.id,
      sender: "Patel Accessibility Advocates",
      dateReceived: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      allegedIssues: JSON.stringify(["Keyboard access / focus issues", "Page language not identified"]),
      listedUrls: JSON.stringify(["https://cedarstreetdental.example", "https://cedarstreetdental.example/appointments"]),
      notes: "Waiting on WordPress login from the client before first scan.",
    },
  });

  console.log("Seeded Harbor & Co. Digital with two sample cases.");
  console.log("Demo login: demo@curepacket.dev / demo1234");
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
