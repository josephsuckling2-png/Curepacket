import Stripe from "stripe";
import { DEFAULT_PACKET_FEE_CENTS, MONITORING_FEE_CENTS } from "@/lib/constants";

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-08-27.basil" });
}

export function packetFeeCents(orgFee?: number | null) {
  return orgFee && orgFee > 0 ? orgFee : DEFAULT_PACKET_FEE_CENTS;
}

export function monitoringFeeCents() {
  return MONITORING_FEE_CENTS;
}

export async function createPacketCheckout(options: {
  caseId: string;
  caseName: string;
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: { caseId: options.caseId, kind: "packet" },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: options.amountCents,
          product_data: {
            name: `CurePacket evidence packet — ${options.caseName}`,
            description:
              "Per-case documentation packet. Not legal advice. Not a compliance certification.",
          },
        },
      },
    ],
  });

  return session;
}

export async function createMonitoringCheckout(options: {
  siteUrl: string;
  caseId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: { caseId: options.caseId ?? "", kind: "monitoring", siteUrl: options.siteUrl },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          recurring: { interval: "month" },
          unit_amount: monitoringFeeCents(),
          product_data: {
            name: "CurePacket site monitoring",
            description: `Monthly monitoring plan stub for ${options.siteUrl}. Alerts and rescans are modeled in-app; production cron is out of scope for this MVP.`,
          },
        },
      },
    ],
  });

  return session;
}
