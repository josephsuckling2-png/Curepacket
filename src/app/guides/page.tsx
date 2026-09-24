import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Disclaimer } from "@/components/disclaimer";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Guides for agencies",
  description:
    "Factual notes for web agencies handling an accessibility demand letter, preparing a packet for counsel, and remediating pages. Not legal advice.",
  alternates: { canonical: "/guides" },
};

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-copper">Guides</p>
        <h1 className="mt-2 font-serif text-5xl text-ink">Notes for the agency desk</h1>
        <p className="mt-4 text-lg text-ink-muted">
          Short, practical pages for teams who just received a client’s demand letter. They describe
          the workflow. They do not tell you what the law requires.
        </p>
        <ul className="mt-10 space-y-6">
          {GUIDES.map((guide) => (
            <li key={guide.slug} className="border-b border-[#e2d8c8] pb-6">
              <Link href={`/guides/${guide.slug}`} className="font-serif text-2xl text-ink hover:underline">
                {guide.title}
              </Link>
              <p className="mt-2 text-sm text-ink-muted">{guide.description}</p>
            </li>
          ))}
        </ul>
        <Disclaimer className="mt-10" />
      </main>
    </div>
  );
}
