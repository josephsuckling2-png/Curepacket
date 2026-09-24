import { ensureStripeCatalog } from "../src/lib/stripe";

async function main() {
  const catalog = await ensureStripeCatalog();
  console.log("Stripe products are ready. You can leave the price ID variables blank;");
  console.log("CurePacket finds these prices by lookup key on the next checkout.");
  console.log("");
  console.log(`STRIPE_PACKET_PRICE_ID=${catalog.packetPriceId ?? ""}`);
  console.log(`STRIPE_MONITORING_PRICE_ID=${catalog.monitoringPriceId ?? ""}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
