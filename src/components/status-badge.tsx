import { Badge } from "@/components/ui/badge";
import {
  CASE_STATUS_LABELS,
  ISSUE_STATUS_LABELS,
  type CaseStatus,
  type IssueStatus,
} from "@/lib/constants";

const caseVariants = {
  intake: "intake",
  scanning: "scanning",
  remediating: "remediating",
  packet_ready: "packet_ready",
  closed: "closed",
} as const;

export function CaseStatusBadge({ status }: { status: string }) {
  const key = status as CaseStatus;
  return (
    <Badge variant={caseVariants[key] ?? "outline"}>
      {CASE_STATUS_LABELS[key] ?? status}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const variant =
    severity === "critical" ||
    severity === "serious" ||
    severity === "moderate" ||
    severity === "minor"
      ? severity
      : "outline";
  return <Badge variant={variant}>{severity}</Badge>;
}

export function IssueStatusBadge({ status }: { status: string }) {
  const key = status as IssueStatus;
  return (
    <Badge variant={status === "fixed" ? "forest" : status === "open" ? "copper" : "outline"}>
      {ISSUE_STATUS_LABELS[key] ?? status}
    </Badge>
  );
}
