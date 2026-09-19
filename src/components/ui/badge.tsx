import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ink text-parchment",
        outline: "border-[#d7cbb8] text-ink-muted",
        copper: "border-transparent bg-copper-soft text-copper",
        forest: "border-transparent bg-forest-soft text-forest",
        critical: "border-transparent bg-red-100 text-red-800",
        serious: "border-transparent bg-orange-100 text-orange-800",
        moderate: "border-transparent bg-amber-100 text-amber-900",
        minor: "border-transparent bg-slate-100 text-slate-700",
        intake: "border-transparent bg-slate-100 text-slate-700",
        scanning: "border-transparent bg-sky-100 text-sky-800",
        remediating: "border-transparent bg-copper-soft text-copper",
        packet_ready: "border-transparent bg-forest-soft text-forest",
        closed: "border-transparent bg-ink/10 text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
