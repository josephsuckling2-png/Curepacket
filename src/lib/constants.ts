export const CASE_STATUSES = [
  "intake",
  "scanning",
  "remediating",
  "packet_ready",
  "closed",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  intake: "Intake",
  scanning: "Scanning",
  remediating: "Remediating",
  packet_ready: "Packet ready",
  closed: "Closed",
};

export const ISSUE_STATUSES = ["open", "in_progress", "fixed", "wont_fix"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  fixed: "Fixed",
  wont_fix: "Won't fix",
};

export const SEVERITIES = ["critical", "serious", "moderate", "minor"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

export const PACKET_DISCLAIMER =
  "This packet is operational documentation prepared to help counsel and the client review automated findings, alleged issues, and remediation notes. CurePacket does not provide legal advice, does not certify WCAG or ADA compliance, and does not claim that any overlay, scan, or packet will prevent or resolve a lawsuit. Automated scanners miss issues and can produce false positives. Human review and qualified legal counsel are required.";

export const PRODUCT_ONE_LINER =
  "Demand letter in → counsel-ready accessibility remediation packet out.";

export const DEFAULT_PACKET_FEE_CENTS = Number(process.env.DEFAULT_PACKET_FEE_CENTS ?? 75000);
export const MONITORING_FEE_CENTS = Number(process.env.MONITORING_FEE_CENTS ?? 4900);

export const DEMO_EMAIL = "demo@curepacket.dev";
export const DEMO_PASSWORD = "demo1234";
