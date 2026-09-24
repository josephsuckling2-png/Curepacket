"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/disclaimer";
import { demoLoginAction, loginAction, magicLinkAction } from "@/app/login/actions";

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const verified = params.get("verified") === "1";
  const [pending, setPending] = useState(false);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to the desk</CardTitle>
        <CardDescription>
          Email and password for your agency. If mail is configured, confirm the link we send before
          the first sign-in. The demo agency is separate and has no connection to a new signup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {verified ? (
          <p className="text-sm text-forest">Email confirmed. Sign in with the password you chose.</p>
        ) : null}
        <form
          className="space-y-4"
          action={async (formData) => {
            setPending(true);
            setError(null);
            const result = await loginAction(formData);
            if (result?.error) setError(result.error);
            setPending(false);
          }}
        >
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue="demo@curepacket.dev" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" defaultValue="demo1234" required />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <form
          action={async () => {
            setPending(true);
            setError(null);
            const result = await demoLoginAction(callbackUrl);
            if (result?.error) setError(result.error);
            setPending(false);
          }}
        >
          <Button type="submit" variant="copper" className="w-full" disabled={pending}>
            Continue as demo agency
          </Button>
        </form>
        <form
          action={async () => {
            const result = await magicLinkAction();
            if (result?.error) setError(result.error);
          }}
        >
          <Button type="submit" variant="outline" className="w-full">
            Request magic link
          </Button>
        </form>
        <p className="text-sm text-ink-muted">
          New agency?{" "}
          <Link href="/register" className="text-copper underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
        <Disclaimer compact />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-parchment paper-grid">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Back to site</Link>
        </Button>
      </div>
      <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
