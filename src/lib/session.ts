import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }
  return session;
}

export async function requireCase(caseId: string) {
  const session = await requireSession();
  const record = await prisma.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
    include: {
      demandLetter: true,
      payment: true,
      scans: { orderBy: { startedAt: "desc" } },
      issues: { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
      changelog: { orderBy: { createdAt: "desc" } },
      packetExports: { orderBy: { createdAt: "desc" } },
      monitoringSubscriptions: true,
    },
  });
  if (!record) {
    redirect("/cases");
  }
  return { session, record };
}
