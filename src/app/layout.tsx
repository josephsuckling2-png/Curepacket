import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CurePacket — Accessibility remediation packets for agencies",
    template: "%s · CurePacket",
  },
  description:
    "Turn an ADA or web-accessibility demand letter into a prioritized fix plan and a timestamped, counsel-ready evidence packet. Workflow and documentation — not legal advice.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
