import Link from "next/link";
import { cn } from "@/lib/utils";

const items = [
  { href: "", label: "Overview" },
  { href: "/intake", label: "Letter intake" },
  { href: "/scan", label: "Scan" },
  { href: "/board", label: "Fix board" },
  { href: "/packet", label: "Evidence packet" },
];

export function CaseNav({ caseId, current }: { caseId: string; current: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const href = `/cases/${caseId}${item.href}`;
        const active = current === item.href;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              active
                ? "border-ink bg-ink text-parchment"
                : "border-[#d7cbb8] bg-white text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
