"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/app/actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-parchment paper-grid">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      <div className="flex flex-1 justify-center px-6 pb-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create an agency workspace</CardTitle>
            <CardDescription>
              One organization, your first owner seat. Invite-style team seats can land later —
              Clerk/Auth.js patterns are already in place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={async (formData) => {
                setError(null);
                const result = await registerAction(formData);
                if (result?.error) setError(result.error);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="organization">Agency name</Label>
                <Input id="organization" name="organization" required placeholder="Harbor & Co. Digital" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" name="name" required placeholder="Avery Chen" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" minLength={8} required />
              </div>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <Button type="submit" className="w-full">
                Create workspace
              </Button>
            </form>
            <p className="mt-4 text-sm text-ink-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-copper underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
