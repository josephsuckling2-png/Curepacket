"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCaseAction } from "@/app/actions";

export function NewCaseForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="mt-8 max-w-2xl">
      <CardHeader>
        <CardTitle>Client and site</CardTitle>
        <CardDescription>
          Status starts at intake. You can attach the demand letter on the next screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={async (formData) => {
            const result = await createCaseAction(formData);
            if (result?.error) setError(result.error);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="clientName">Client name</Label>
            <Input id="clientName" name="clientName" required placeholder="Northwind Provisions" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Client email</Label>
            <Input id="clientEmail" name="clientEmail" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input
              id="siteUrl"
              name="siteUrl"
              required
              placeholder="http://localhost:3000/fixtures/demo-site/index.html"
            />
            <p className="text-xs text-ink-soft">
              For a local demo scan, use the bundled fixture site at
              <code className="ml-1">/fixtures/demo-site/index.html</code>.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadlineAt">Cure window / deadline</Label>
            <Input id="deadlineAt" name="deadlineAt" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <Button type="submit" variant="copper">
            Create case
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
