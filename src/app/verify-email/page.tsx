import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/mail";
import { hashVerificationToken } from "@/lib/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.trim() ?? "";
  let confirmed = false;
  if (token) {
    const user = await prisma.user.findFirst({
      where: { verifyTokenHash: hashVerificationToken(token) },
    });
    if (user?.verifyTokenExpires && user.verifyTokenExpires.getTime() > Date.now()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), verifyTokenHash: null, verifyTokenExpires: null },
      });
      await sendWelcomeEmail(user.email, user.name);
      confirmed = true;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{confirmed ? "Email confirmed" : "Confirmation link not valid"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-ink-muted">
          <p>
            {confirmed
              ? "Your agency workspace is ready. Sign in with the email and password you chose. The workspace starts empty."
              : "The link is missing, expired, or already used. Register again or sign in if you already confirmed."}
          </p>
          <Button asChild>
            <Link href="/login">{confirmed ? "Sign in" : "Back to sign in"}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
