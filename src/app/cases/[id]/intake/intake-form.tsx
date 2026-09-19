"use client";

import { useState } from "react";
import { extractIntakeAction, saveIntakeAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type IntakeValues = {
  sender: string;
  dateReceived: string;
  allegedIssues: string;
  listedUrls: string;
  notes: string;
  rawText: string;
};

export function IntakeForm({ caseId, initial }: { caseId: string; initial: IntakeValues }) {
  const [message, setMessage] = useState<string | null>(null);
  const [rawText, setRawText] = useState(initial.rawText);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Structured intake</CardTitle>
          <CardDescription>
            These fields travel into the evidence packet. Treat extracted values as a draft.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={async (formData) => {
              const result = await saveIntakeAction(caseId, formData);
              setMessage(result?.error ?? "Intake saved.");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="sender">Sender / counsel</Label>
              <Input id="sender" name="sender" defaultValue={initial.sender} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateReceived">Date received</Label>
              <Input id="dateReceived" name="dateReceived" type="date" defaultValue={initial.dateReceived} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allegedIssues">Alleged issues (one per line)</Label>
              <Textarea id="allegedIssues" name="allegedIssues" defaultValue={initial.allegedIssues} rows={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listedUrls">Listed URLs (one per line)</Label>
              <Textarea id="listedUrls" name="listedUrls" defaultValue={initial.listedUrls} rows={5} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={initial.notes} />
            </div>
            <input type="hidden" name="rawText" value={rawText} />
            <Button type="submit">Save intake</Button>
          </form>
          {message ? <p className="mt-3 text-sm text-forest">{message}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Paste letter text</CardTitle>
          <CardDescription>
            Local regex/heuristics extract URLs, WCAG citations, and common issue phrases. Optional
            LLM extraction runs only when ENABLE_LLM_EXTRACT=true and OPENAI_API_KEY is set.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={async (formData) => {
              const text = String(formData.get("rawText") ?? "");
              setRawText(text);
              const result = await extractIntakeAction(caseId, text);
              setMessage(
                result?.error ??
                  (result.extracted?.usedLlm
                    ? "Extracted with LLM assist. Reload if fields look stale."
                    : "Extracted with heuristics. Review the structured fields, then save."),
              );
              if (result?.ok) {
                window.location.reload();
              }
            }}
          >
            <Textarea
              name="rawText"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={16}
              placeholder="Paste the demand letter…"
            />
            <Button type="submit" variant="outline">
              Extract URLs and issues
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
