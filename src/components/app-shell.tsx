import type { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

const nav = [
  { href: "/dashboard", label: "Desk" },
  { href: "/cases", label: "Cases" },
  { href: "/cases/new", label: "New case" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export async function AppShell({
  children,
  orgName,
  userName,
}: {
  children: ReactNode;
  orgName: string;
  userName: string;
}) {
  const session = await auth();
  const items = isAdminEmail(session?.user?.email)
    ? [...nav, { href: "/admin", label: "Admin" }]
    : nav;

  return (
    <div className="min-h-screen bg-parchment">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#e2d8c8] bg-parchment-card px-5 py-6 md:flex md:flex-col">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-ink-soft">Agency</p>
        <p className="mt-1 font-medium text-ink">{orgName}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-parchment-deep hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Disclaimer compact />
      </aside>
      <div className="md:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-[#e2d8c8] bg-parchment-card/80 px-6">
          <div className="md:hidden">
            <Logo />
          </div>
          <p className="hidden text-sm text-ink-muted md:block">Signed in as {userName}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
