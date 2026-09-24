import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-[#e2d8c8]/80 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="CurePacket home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex">
          <Link href="/#how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link href="/#who" className="hover:text-ink">
            Who it&apos;s for
          </Link>
          <Link href="/#pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/guides" className="hover:text-ink">
            Guides
          </Link>
          <Link href="/#positioning" className="hover:text-ink">
            Positioning
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Open desk</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="copper">
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
