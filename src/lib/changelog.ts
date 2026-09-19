import { prisma } from "@/lib/prisma";

export async function addChangelog(caseId: string, message: string, authorName?: string | null) {
  return prisma.changelogEntry.create({
    data: {
      caseId,
      message,
      authorName: authorName ?? "System",
    },
  });
}
