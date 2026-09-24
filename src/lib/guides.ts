export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  sections: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "ada-demand-letter",
    title: "What to do when a client gets an ADA website demand letter",
    description:
      "A practical sequence for a web agency when a client forwards an accessibility demand letter. Not legal advice.",
    sections: [
      {
        heading: "What the letter is",
        paragraphs: [
          "A demand letter is a letter, often from a lawyer, that alleges the client’s website has accessibility barriers and asks for changes, money, or both by a date. It is not a court order and it is not a judgment.",
          "Whether the Americans with Disabilities Act applies to that website, and what the letter legally requires, depends on facts a lawyer has to assess. CurePacket does not make that call.",
        ],
      },
      {
        heading: "A practical sequence for the agency",
        bullets: [
          "Save the letter unchanged, including the date, the sender, and every URL it names.",
          "Note any deadline written in the letter and tell the client to share it with their lawyer.",
          "Do not reply to the sender with a claim that the site is “compliant,” “certified,” or protected from a lawsuit.",
          "List the pages the letter names, plus the homepage, as the first set of URLs to inspect.",
          "Separate what the letter alleges from what an automated check can actually see. Those lists are not the same.",
          "Track what your team changes, who changed it, and when. Counsel usually wants that record more than a screenshot folder.",
          "Hand the notes, the scan output, and the changelog to the client’s lawyer. Let counsel decide what to send back.",
        ],
      },
      {
        heading: "Where CurePacket fits",
        paragraphs: [
          "CurePacket stores the letter, runs a Playwright and axe-core scan of the named pages, keeps a fix board, and exports a timestamped packet. The packet is documentation for counsel review. It is not a legal opinion and it is not a WCAG certification.",
        ],
      },
    ],
  },
  {
    slug: "evidence-packet",
    title: "How an evidence packet helps counsel",
    description:
      "What a remediation packet contains and what it does not decide. Written for agencies preparing a file for a client’s lawyer.",
    sections: [
      {
        heading: "What counsel is usually missing",
        paragraphs: [
          "When a demand letter arrives, the client’s lawyer often gets a forwarded email and a pile of screenshots. A usable file answers a smaller set of questions: what was alleged, which URLs were named, what an automated scan reported, what the team changed, and when those notes were written.",
        ],
      },
      {
        heading: "What the CurePacket export includes",
        bullets: [
          "Case details: client, site URL, status, and the deadline your team entered.",
          "A summary of the demand letter as you recorded it: sender, date received, alleged issues, and listed URLs.",
          "The latest scan: pages reached, finding counts, and severity labels from axe-core.",
          "The issue register: rule, page, status, and before/after notes your team typed.",
          "A changelog of those updates.",
          "A written disclaimer that the packet is not legal advice and not a compliance certification.",
        ],
      },
      {
        heading: "What the packet does not do",
        paragraphs: [
          "An automated scan misses barriers and it reports false positives. A PDF does not prove that a site conforms to WCAG, that the ADA claim is valid or invalid, or that a lawsuit will stop. The client’s lawyer decides how to use the file. CurePacket only keeps the operational record in one place.",
        ],
      },
    ],
  },
  {
    slug: "remediation-checklist",
    title: "Accessibility remediation checklist for agency teams",
    description:
      "An engineering checklist to use before you hand a file to counsel. It is not a complete WCAG audit and it is not legal advice.",
    sections: [
      {
        heading: "How to use this list",
        paragraphs: [
          "Work the pages named in the letter first, then the templates those pages share. WCAG 2.2 is a W3C recommendation, not a statute. The criterion numbers below are the published names of common checks. Meeting a checklist item is not a certification, and skipping one is not a legal conclusion.",
          "The W3C publishes the criteria at w3.org/TR/WCAG22/. Questions about the ADA belong with the client’s lawyer. The U.S. Department of Justice publishes ADA materials at ada.gov.",
        ],
      },
      {
        heading: "Checks worth making on the named pages",
        bullets: [
          "Images that convey information have a text alternative. Decorative images are marked so assistive technology can skip them. (WCAG 2.2 Success Criterion 1.1.1)",
          "Text has enough contrast with its background. Under WCAG 2.2 Success Criterion 1.4.3, the AA threshold is 4.5:1 for normal text and 3:1 for large text.",
          "Form fields have a visible label, not only placeholder text. (Success Criteria 1.3.1 and 3.3.2)",
          "The page can be operated with a keyboard, and focus is visible when it moves. (Success Criteria 2.1.1 and 2.4.7)",
          "The page identifies its language in the html element. (Success Criterion 3.1.1)",
          "Headings describe the sections and do not skip levels just for visual size. (Success Criterion 1.3.1)",
          "Links and buttons have names that still make sense out of context. (Success Criteria 2.4.4 and 4.1.2)",
          "Status messages and errors are not conveyed by color alone.",
          "After a fix, rerun the scan and have a person complete the same task with the keyboard.",
          "Do not treat an overlay widget as the remediation. Fix the page.",
        ],
      },
      {
        heading: "What to write down",
        paragraphs: [
          "For each item, record the page, what you changed, and the date. That note is what the evidence packet is for. Leave the legal response to counsel.",
        ],
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}
