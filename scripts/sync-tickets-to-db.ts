import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PAYSTACK_SECRET_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getMetaField(metadata: any, name: string): string | null {
  if (!metadata) return null;
  if (metadata[name]) return metadata[name];
  if (metadata.custom_fields) {
    const field = metadata.custom_fields.find((f: any) => f.variable_name === name);
    return field ? field.value : null;
  }
  return null;
}

async function fetchPaystackTransactions(): Promise<any[]> {
  const all: any[] = [];
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

    all.push(...transactions);

    if (transactions.length < perPage) break;
    page++;
  }

  return all;
}

async function main() {
  console.log("Fetching transactions from Paystack (May 1 onwards)...\n");
  const transactions = await fetchPaystackTransactions();
  console.log(`Fetched ${transactions.length} transactions.\n`);

  const ticketTxns = transactions.filter((tx) => {
    const metadata = tx.metadata || {};
    const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
    const reference = tx.reference || "";
    return tx.status === "success" && (
      paymentType === "ticket" ||
      reference.startsWith("ticket_")
    );
  });

  console.log(`Found ${ticketTxns.length} successful ticket transactions.\n`);

  // Build ticket records
  const ticketRecords: any[] = [];
  const tierCounts: Record<string, { qty: number; amount: number; txs: number }> = {};

  for (const tx of ticketTxns) {
    const metadata = tx.metadata || {};
    const reference = tx.reference;
    const tier = getMetaField(metadata, "ticket_tier") || getMetaField(metadata, "tier") || "regular";
    const tierLabel = getMetaField(metadata, "tier_label") || tier;
    const qty = Math.max(1, parseInt(getMetaField(metadata, "quantity") || "1", 10));
    const amountNaira = tx.amount / 100;
    const unitPrice = Math.round(amountNaira / qty);

    ticketRecords.push({
      full_name: getMetaField(metadata, "full_name") || getMetaField(metadata, "name") || "Unknown",
      email: tx.customer?.email || getMetaField(metadata, "email") || getMetaField(metadata, "buyer_email") || "",
      tier,
      tier_label: tierLabel,
      quantity: qty,
      unit_price_naira: unitPrice,
      total_amount_naira: amountNaira,
      paystack_reference: reference,
      payment_channel: tx.channel || "card",
      created_at: tx.paid_at || tx.created_at,
    });

    if (!tierCounts[tier]) {
      tierCounts[tier] = { qty: 0, amount: 0, txs: 0 };
    }
    tierCounts[tier].qty += qty;
    tierCounts[tier].amount += amountNaira;
    tierCounts[tier].txs++;
  }

  console.log("=== TICKET SALES FROM PAYSTACK ===\n");
  for (const [tier, info] of Object.entries(tierCounts)) {
    console.log(`${tier}: ${info.qty} tickets (${info.txs} transactions) — N${info.amount.toLocaleString()}`);
  }

  const totalQty = Object.values(tierCounts).reduce((s, i) => s + i.qty, 0);
  const totalAmount = Object.values(tierCounts).reduce((s, i) => s + i.amount, 0);
  console.log(`\nTOTAL: ${totalQty} tickets — N${totalAmount.toLocaleString()}`);

  // Now populate Supabase
  console.log(`\n\nInserting ${ticketRecords.length} ticket records into Supabase...`);

  console.log("Clearing existing tickets table...");
  await supabase.from("tickets").delete().neq("id", 0);

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < ticketRecords.length; i += batchSize) {
    const batch = ticketRecords.slice(i, i + batchSize);
    const { error } = await supabase.from("tickets").insert(batch);

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n✅ Inserted ${inserted} ticket records into Supabase`);

  const { count } = await supabase.from("tickets").select("*", { count: "exact", head: true });
  console.log(`Tickets table now has ${count} records`);
}

main();
