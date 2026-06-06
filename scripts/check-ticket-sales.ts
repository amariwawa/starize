import { config } from "dotenv";
config({ path: ".env.local" });

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.error("Missing PAYSTACK_SECRET_KEY");
  process.exit(1);
}

function getMetaField(metadata: any, name: string): string | null {
  if (!metadata) return null;
  if (metadata[name]) return metadata[name];
  if (metadata.custom_fields) {
    const field = metadata.custom_fields.find(
      (f: any) => f.variable_name === name
    );
    return field ? field.value : null;
  }
  return null;
}

async function main() {
  const totals: Record<string, { transactions: number; quantity: number; amount: number }> = {
    regular: { transactions: 0, quantity: 0, amount: 0 },
    vip: { transactions: 0, quantity: 0, amount: 0 },
    vip_table: { transactions: 0, quantity: 0, amount: 0 },
    unknown: { transactions: 0, quantity: 0, amount: 0 },
  };

  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await fetch(
      `https://api.paystack.co/transaction?perPage=${perPage}&page=${page}&from=2026-05-01T00:00:00.000Z`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    );

    if (!response.ok) {
      console.error("Paystack fetch failed:", response.status);
      break;
    }

    const result = await response.json();
    const transactions = result.data || [];
    if (transactions.length === 0) break;

    for (const tx of transactions) {
      if (tx.status !== "success") continue;

      const reference = tx.reference || "";
      const metadata = tx.metadata || {};
      const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
      const isTicket = paymentType === "ticket" || reference.startsWith("ticket_");

      if (!isTicket) continue;

      let tier = getMetaField(metadata, "ticket_tier") || getMetaField(metadata, "tier") || "unknown";
      if (tier === "unknown" && reference.startsWith("ticket_")) {
        const parts = reference.split("_");
        if (parts.length >= 2) tier = parts[1];
      }

      const qty = Math.max(1, parseInt(getMetaField(metadata, "quantity") || "1", 10));
      const amountNaira = tx.amount / 100;

      if (!totals[tier]) totals[tier] = { transactions: 0, quantity: 0, amount: 0 };
      totals[tier].transactions++;
      totals[tier].quantity += qty;
      totals[tier].amount += amountNaira;
    }

    if (transactions.length < perPage) break;
    page++;
  }

  console.log("\n=== TICKET SALES SUMMARY ===\n");

  const vipTable = totals.vip_table || { transactions: 0, quantity: 0, amount: 0 };
  const vip = totals.vip || { transactions: 0, quantity: 0, amount: 0 };
  const regular = totals.regular || { transactions: 0, quantity: 0, amount: 0 };

  console.log(`TABLE OF 4 (vip_table):`);
  console.log(`  Transactions: ${vipTable.transactions}`);
  console.log(`  Tables sold:  ${vipTable.quantity}`);
  console.log(`  People covered: ${vipTable.quantity * 4}`);
  console.log(`  Revenue:        N${vipTable.amount.toLocaleString()}`);

  console.log(`\nVIP TICKETS:`);
  console.log(`  Transactions: ${vip.transactions}`);
  console.log(`  Tickets sold: ${vip.quantity}`);
  console.log(`  Revenue:      N${vip.amount.toLocaleString()}`);

  console.log(`\nREGULAR TICKETS:`);
  console.log(`  Transactions: ${regular.transactions}`);
  console.log(`  Tickets sold: ${regular.quantity}`);
  console.log(`  Revenue:      N${regular.amount.toLocaleString()}`);

  const totalTickets = vipTable.quantity * 4 + vip.quantity + regular.quantity;
  const totalRevenue = vipTable.amount + vip.amount + regular.amount;

  console.log(`\n=== TOTALS ===`);
  console.log(`  Total people covered: ${totalTickets}`);
  console.log(`  Total revenue:        N${totalRevenue.toLocaleString()}`);
}

main();
