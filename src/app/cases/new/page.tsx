import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { NewCaseForm } from "./new-case-form";

export default async function NewCasePage() {
  const session = await requireSession();

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">New case</p>
      <h1 className="mt-1 font-serif text-4xl">Open a client file</h1>
      <NewCaseForm />
    </AppShell>
  );
}
