import Stripe from "stripe";
import { DEFAULT_PACKET_FEE_CENTS, MONITORING_FEE_CENTS } from "@/lib/constants";

export const PACKET_LOOKUP_KEY = "curepacket_packet_fee";
export const MONITORING_LOOKUP_KEY = "curepacket_monitoring_monthly";

const priceCache = new Map<string, string>();

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2025-08-27.basil" });
  }
  return stripeClient;
}

export function packetFeeCents(orgFee?: number | null) {
  return orgFee && orgFee > 0 ? orgFee : DEFAULT_PACKET_FEE_CENTS;
}

export function monitoringFeeCents() {
  return MONITORING_FEE_CENTS;
}

type CatalogPrice = {
  id: string;
  unitAmount: number | null;
};

async function findOrCreatePrice(
  stripe: Stripe,
  options: {
    lookupKey: string;
    envNames: string[];
    productName: string;
    description: string;
    unitAmount: number;
    recurring: boolean;
    kind: string;
  },
): Promise<CatalogPrice | null> {
  for (const name of options.envNames) {
    const fromEnv = process.env[name]?.trim();
    if (fromEnv) {
      try {
        const price = await stripe.prices.retrieve(fromEnv);
        return { id: price.id, unitAmount: price.unit_amount };
      } catch (error) {
        console.error(`Stripe price ${name} could not be loaded; creating one instead.`, error);
      }
    }
  }

  const cached = priceCache.get(options.lookupKey);
  if (cached) return { id: cached, unitAmount: options.unitAmount };

  const listed = await stripe.prices.list({
    lookup_keys: [options.lookupKey],
    active: true,
    limit: 1,
  });
  const existing = listed.data[0];
  if (existing) {
    priceCache.set(options.lookupKey, existing.id);
    return { id: existing.id, unitAmount: existing.unit_amount };
  }

  const product = await stripe.products.create({
    name: options.productName,
    description: options.description,
    metadata: { curepacket: options.kind },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: options.unitAmount,
    lookup_key: options.lookupKey,
    ...(options.recurring ? { recurring: { interval: "month" as const } } : {}),
    metadata: { curepacket: options.kind },
  });
  priceCache.set(options.lookupKey, price.id);
  return { id: price.id, unitAmount: price.unit_amount };
}

export async function ensureStripeCatalog() {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }

  const packet = await findOrCreatePrice(stripe, {
    lookupKey: PACKET_LOOKUP_KEY,
    envNames: ["STRIPE_PACKET_PRICE_ID"],
    productName: "CurePacket evidence packet",
    description: "Per-case documentation packet. Not legal advice. Not a compliance certification.",
    unitAmount: DEFAULT_PACKET_FEE_CENTS,
    recurring: false,
    kind: "packet",
  });
  const monitoring = await findOrCreatePrice(stripe, {
    lookupKey: MONITORING_LOOKUP_KEY,
    envNames: ["STRIPE_MONITORING_PRICE_ID"],
    productName: "CurePacket site monitoring",
    description: "Monthly monitoring plan. Alerts and rescans are modeled in-app.",
    unitAmount: monitoringFeeCents(),
    recurring: true,
    kind: "monitoring",
  });

  return {
    packetPriceId: packet?.id ?? null,
    monitoringPriceId: monitoring?.id ?? null,
  };
}

async function lineItemForAmount(options: {
  kind: "packet" | "monitoring";
  amountCents: number;
  name: string;
  description: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const price = await findOrCreatePrice(stripe, {
      lookupKey: options.kind === "packet" ? PACKET_LOOKUP_KEY : MONITORING_LOOKUP_KEY,
      envNames:
        options.kind === "packet" ? ["STRIPE_PACKET_PRICE_ID"] : ["STRIPE_MONITORING_PRICE_ID"],
      productName: options.name,
      description: options.description,
      unitAmount: options.amountCents,
      recurring: options.kind === "monitoring",
      kind: options.kind,
    });
    if (price && price.unitAmount === options.amountCents) {
      return { quantity: 1, price: price.id };
    }
  } catch (error) {
    console.error("Could not reuse a Stripe price; falling back to an inline price.", error);
  }

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: options.amountCents,
      ...(options.kind === "monitoring" ? { recurring: { interval: "month" as const } } : {}),
      product_data: {
        name: options.name,
        description: options.description,
      },
    },
  };
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

  const lineItem = await lineItemForAmount({
    kind: "packet",
    amountCents: options.amountCents,
    name: `CurePacket evidence packet — ${options.caseName}`,
    description: "Per-case documentation packet. Not legal advice. Not a compliance certification.",
  });
  if (!lineItem) return null;

  return stripe.checkout.sessions.create({
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: { caseId: options.caseId, kind: "packet" },
    line_items: [lineItem],
  });
}

export async function createMonitoringCheckout(options: {
  siteUrl: string;
  caseId?: string;
  monitoringId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const lineItem = await lineItemForAmount({
    kind: "monitoring",
    amountCents: monitoringFeeCents(),
    name: "CurePacket site monitoring",
    description: `Monthly monitoring plan for ${options.siteUrl}. Alerts and rescans are modeled in-app; production cron is out of scope for this MVP.`,
  });
  if (!lineItem) return null;

  return stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: {
      caseId: options.caseId ?? "",
      kind: "monitoring",
      siteUrl: options.siteUrl,
      monitoringId: options.monitoringId,
    },
    line_items: [lineItem],
  });
}
