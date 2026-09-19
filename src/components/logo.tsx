import { cn } from "@/lib/utils";

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-navy text-parchment">
        <span className="font-serif text-lg leading-none">C</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-sm bg-copper" />
      </span>
      {!markOnly ? <span className="font-serif text-xl tracking-tight">CurePacket</span> : null}
    </span>
  );
}
