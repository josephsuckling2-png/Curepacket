import { PACKET_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Disclaimer({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <p className={cn("text-xs leading-relaxed text-ink-soft", className)}>
      {compact
        ? "CurePacket is workflow and documentation software for counsel review. It is not legal advice and does not certify WCAG compliance or lawsuit protection."
        : PACKET_DISCLAIMER}
    </p>
  );
}
