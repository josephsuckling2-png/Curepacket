"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function demoLoginAction(callbackUrl?: string) {
  try {
    await signIn("demo", {
      email: "demo@curepacket.dev",
      redirectTo: callbackUrl || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Demo user is missing. Run npm run db:seed." };
    }
    throw error;
  }
}

export async function magicLinkAction() {
  return {
    error:
      "Magic-link email is Clerk/Auth.js-ready. Set AUTH_RESEND_KEY to enable it. For local demo, use email/password or Continue as demo agency.",
  };
}
