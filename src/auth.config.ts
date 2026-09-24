import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // Render terminates TLS and forwards the public host. Trust it so Auth.js
  // accepts the proxy host instead of rejecting the request.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = ["/dashboard", "/cases", "/billing", "/settings"].some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      );
      if (isProtected && !auth?.user) return false;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.organizationName = (user as { organizationName?: string }).organizationName;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.organizationId = String(token.organizationId ?? "");
        session.user.organizationName = String(token.organizationName ?? "");
        session.user.role = String(token.role ?? "member");
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
