import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrgSettingsAction } from "@/app/actions";

export default async function SettingsPage() {
  const session = await requireSession();
  const org = await prisma.organization.findUnique({ where: { id: session.user.organizationId } });

  return (
    <AppShell orgName={session.user.organizationName} userName={session.user.name ?? ""}>
      <p className="text-xs uppercase tracking-[0.18em] text-copper">Settings</p>
      <h1 className="mt-1 font-serif text-4xl">Agency workspace</h1>
      <Card className="mt-8 max-w-xl">
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Packet fee is what Stripe Checkout (or the local stub) charges per case.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateOrgSettingsAction(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Agency name</Label>
              <Input id="name" name="name" defaultValue={org?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="packetFee">Packet fee (USD)</Label>
              <Input
                id="packetFee"
                name="packetFee"
                type="number"
                min={1}
                step={1}
                defaultValue={((org?.packetFeeCents ?? 75000) / 100).toString()}
              />
            </div>
            <Button type="submit">Save settings</Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
