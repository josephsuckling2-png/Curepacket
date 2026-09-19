import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6">
      <Logo />
      <h1 className="mt-8 font-serif text-4xl">That file is not on the desk.</h1>
      <p className="mt-3 text-sm text-ink-muted">The page may have moved, or the case is in another workspace.</p>
      <Button asChild className="mt-6">
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
