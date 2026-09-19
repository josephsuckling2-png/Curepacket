export type ExtractedLetter = {
  sender: string | null;
  dateReceived: string | null;
  allegedIssues: string[];
  listedUrls: string[];
  notes: string | null;
  usedLlm: boolean;
};

const URL_RE = /https?:\/\/[^\s)>"']+/gi;
const WCAG_RE = /(?:WCAG\s*)?(?:1|2)\.\d\.\d{1,2}/gi;
const ISSUE_HINTS = [
  { re: /alt text|alternative text|missing alt/i, label: "Images missing alternative text" },
  { re: /contrast|color contrast|low contrast/i, label: "Insufficient color contrast" },
  { re: /keyboard|focus|tab order/i, label: "Keyboard access / focus issues" },
  { re: /form label|unlabeled|input without/i, label: "Form controls without labels" },
  { re: /heading|document structure/i, label: "Heading / document structure" },
  { re: /link purpose|empty link|ambiguous link/i, label: "Unclear or empty link purpose" },
  { re: /caption|transcript|video|audio/i, label: "Media without captions or transcripts" },
  { re: /aria|screen reader/i, label: "Assistive-technology / ARIA issues" },
  { re: /skip nav|bypass/i, label: "No skip-navigation mechanism" },
  { re: /language|lang=/i, label: "Page language not identified" },
];

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function extractSender(text: string) {
  const patterns = [
    /from:\s*(.+)/i,
    /sender:\s*(.+)/i,
    /plaintiff(?:'s)? counsel:\s*(.+)/i,
    /very truly yours,?\s+([A-Z][A-Za-z.'&\s,-]{3,80})/,
    /([A-Z][A-Za-z.&'\s]+(?:Law|LLP|P\.?C\.?|Attorneys?))/ ,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].split("\n")[0].trim().slice(0, 160);
  }
  return null;
}

function extractDate(text: string) {
  const match = text.match(
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  );
  return match?.[0] ?? null;
}

export function extractLetterHeuristics(rawText: string): ExtractedLetter {
  const urls = unique((rawText.match(URL_RE) ?? []).map((url) => url.replace(/[.,;]+$/, "")));
  const wcag = unique(rawText.match(WCAG_RE) ?? []);
  const hinted = ISSUE_HINTS.filter((hint) => hint.re.test(rawText)).map((hint) => hint.label);
  const allegedIssues = unique([
    ...hinted,
    ...wcag.map((rule) => `Alleged WCAG ${rule.replace(/wcag\s*/i, "")}`),
  ]);

  return {
    sender: extractSender(rawText),
    dateReceived: extractDate(rawText),
    allegedIssues,
    listedUrls: urls,
    notes: allegedIssues.length
      ? "Fields were prefilled from letter text using local heuristics. Review and edit before relying on them."
      : "No structured issues were detected. Add alleged issues and URLs manually.",
    usedLlm: false,
  };
}

export async function extractLetter(rawText: string): Promise<ExtractedLetter> {
  const heuristic = extractLetterHeuristics(rawText);
  const enabled = process.env.ENABLE_LLM_EXTRACT === "true";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!enabled || !apiKey) {
    return heuristic;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract structured fields from an accessibility demand letter. Return JSON with sender, dateReceived (ISO or original string), allegedIssues (string[]), listedUrls (string[]), notes. Do not give legal advice.",
          },
          { role: "user", content: rawText.slice(0, 12000) },
        ],
      }),
    });
    if (!response.ok) return heuristic;
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return {
      sender: parsed.sender || heuristic.sender,
      dateReceived: parsed.dateReceived || heuristic.dateReceived,
      allegedIssues: unique([...(parsed.allegedIssues ?? []), ...heuristic.allegedIssues]),
      listedUrls: unique([...(parsed.listedUrls ?? []), ...heuristic.listedUrls]),
      notes: parsed.notes || heuristic.notes,
      usedLlm: true,
    };
  } catch {
    return heuristic;
  }
}
