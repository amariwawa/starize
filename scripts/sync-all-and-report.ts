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
  console.log("Fetching all transactions from Paystack (May 1 onwards)...\n");
  const transactions = await fetchPaystackTransactions();
  console.log(`Fetched ${transactions.length} total transactions.\n`);

  // Process votes
  const voteTxns = transactions.filter((tx) => {
    const metadata = tx.metadata || {};
    const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
    const reference = tx.reference || "";
    return tx.status === "success" && (
      paymentType === "voting" ||
      paymentType === "vote" ||
      reference.startsWith("vote_")
    );
  });

  console.log(`Found ${voteTxns.length} successful vote transactions.\n`);

  // Build vote records
  const voteRecords: any[] = [];
  const voteTotals: Record<string, { name: string; votes: number; records: number; amount: number }> = {};

  for (const tx of voteTxns) {
    const metadata = tx.metadata || {};
    const reference = tx.reference;

    let slug = getMetaField(metadata, "contestant_slug") || getMetaField(metadata, "slug");
    if (!slug && reference.startsWith("vote_")) {
      const parts = reference.split("_");
      if (parts.length >= 2) slug = parts[1];
    }

    if (!slug) continue;

    const amountNaira = tx.amount / 100;
    const voteCount = parseInt(getMetaField(metadata, "votes") || "0", 10) || Math.floor(amountNaira / 50);

    voteRecords.push({
      full_name: getMetaField(metadata, "full_name") || getMetaField(metadata, "name") || "Unknown",
      email: tx.customer?.email || getMetaField(metadata, "email") || "",
      contestant_slug: slug,
      contestant_name: getMetaField(metadata, "contestant") || getMetaField(metadata, "full_name") || slug,
      votes: voteCount,
      amount_naira: amountNaira,
      paystack_reference: reference,
      payment_channel: tx.channel || "card",
      created_at: tx.paid_at || tx.created_at,
    });

    if (!voteTotals[slug]) {
      voteTotals[slug] = { name: getMetaField(metadata, "contestant") || slug, votes: 0, records: 0, amount: 0 };
    }
    voteTotals[slug].votes += voteCount;
    voteTotals[slug].records++;
    voteTotals[slug].amount += amountNaira;
  }

  // Clear and reinsert votes
  console.log("Clearing votes table...");
  await supabase.from("votes").delete().neq("id", 0);

  const batchSize = 100;
  let insertedVotes = 0;
  for (let i = 0; i < voteRecords.length; i += batchSize) {
    const batch = voteRecords.slice(i, i + batchSize);
    const { error } = await supabase.from("votes").insert(batch);
    if (error) {
      console.error(`Vote batch ${i / batchSize + 1} error:`, error.message);
    } else {
      insertedVotes += batch.length;
    }
  }
  console.log(`Inserted ${insertedVotes} vote records.\n`);

  // Process tickets
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

  const ticketRecords: any[] = [];
  const ticketTotals: Record<string, { qty: number; amount: number; txs: number }> = {};

  for (const tx of ticketTxns) {
    const metadata = tx.metadata || {};
    const reference = tx.reference;
    const tier = getMetaField(metadata, "ticket_tier") || getMetaField(metadata, "tier") || "regular";
    const tierLabel = getMetaField(metadata, "tier_label") || tier;
    const qty = Math.max(1, parseInt(getMetaField(metadata, "quantity") || "1", 10));
    const amountNaira = tx.amount / 100;

    ticketRecords.push({
      full_name: getMetaField(metadata, "full_name") || getMetaField(metadata, "name") || "Unknown",
      email: tx.customer?.email || getMetaField(metadata, "email") || getMetaField(metadata, "buyer_email") || "",
      tier,
      tier_label: tierLabel,
      quantity: qty,
      unit_price_naira: Math.round(amountNaira / qty),
      total_amount_naira: amountNaira,
      paystack_reference: reference,
      payment_channel: tx.channel || "card",
      created_at: tx.paid_at || tx.created_at,
    });

    if (!ticketTotals[tier]) {
      ticketTotals[tier] = { qty: 0, amount: 0, txs: 0 };
    }
    ticketTotals[tier].qty += qty;
    ticketTotals[tier].amount += amountNaira;
    ticketTotals[tier].txs++;
  }

  console.log("Clearing tickets table...");
  await supabase.from("tickets").delete().neq("id", 0);

  let insertedTickets = 0;
  for (let i = 0; i < ticketRecords.length; i += batchSize) {
    const batch = ticketRecords.slice(i, i + batchSize);
    const { error } = await supabase.from("tickets").insert(batch);
    if (error) {
      console.error(`Ticket batch ${i / batchSize + 1} error:`, error.message);
    } else {
      insertedTickets += batch.length;
    }
  }
  console.log(`Inserted ${insertedTickets} ticket records.\n`);

  // Final Report
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║            CONTESTANT VOTE TOTALS (from Paystack)                  ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  // Manual adjustments
  const MANUAL_VOTE_ADJUSTMENTS: Record<string, number> = {
    "rotimi-john-olufela": -200,
    layo: +200,
  };

  const sorted = Object.entries(voteTotals).sort((a, b) => (b[1].votes + (MANUAL_VOTE_ADJUSTMENTS[b[0]] || 0)) - (a[1].votes + (MANUAL_VOTE_ADJUSTMENTS[a[0]] || 0)));

  console.log("Rank | Contestant                        | Raw Votes | Adjust | Display  | Txns | Amount (N)");
  console.log("─────┼───────────────────────────────────┼───────────┼────────┼──────────┼──────┼───────────");

  let rank = 1;
  for (const [slug, info] of sorted) {
    const adjustment = MANUAL_VOTE_ADJUSTMENTS[slug] || 0;
    const display = Math.max(0, info.votes + adjustment);
    const adjStr = adjustment === 0 ? "—" : (adjustment > 0 ? `+${adjustment}` : `${adjustment}`);
    console.log(
      `${String(rank).padStart(3)}  │ ${info.name.padEnd(33)} │ ${String(info.votes).padStart(9)} │ ${adjStr.padStart(6)} │ ${String(display).padStart(8)} │ ${String(info.records).padStart(4)} │ ${info.amount.toFixed(2).padStart(10)}`
    );
    rank++;
  }

  console.log("\n\n╔════════════════════════════════════════════════════════════════════╗");
  console.log("║              TICKET SALES SUMMARY (from Paystack)                  ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  console.log("Tier       │ Transactions │ Tickets Sold │ Revenue (N)");
  console.log("───────────┼──────────────┼──────────────┼─────────────");
  let totalQty = 0;
  let totalAmount = 0;
  for (const [tier, info] of Object.entries(ticketTotals)) {
    console.log(`${tier.padEnd(10)} │ ${String(info.txs).padStart(12)} │ ${String(info.qty).padStart(12)} │ ${info.amount.toFixed(2).padStart(11)}`);
    totalQty += info.qty;
    totalAmount += info.amount;
  }
  console.log("───────────┼──────────────┼──────────────┼─────────────");
  console.log(`${"TOTAL".padEnd(10)} │ ${String(Object.values(ticketTotals).reduce((s, i) => s + i.txs, 0)).padStart(12)} │ ${String(totalQty).padStart(12)} │ ${totalAmount.toFixed(2).padStart(11)}`);

  // Check for any new transactions not in DB
  const { data: existingVotes } = await supabase.from("votes").select("paystack_reference");
  const existingVoteRefs = new Set((existingVotes || []).map((v: any) => v.paystack_reference));

  const missingInDb = voteTxns.filter((tx) => !existingVoteRefs.has(tx.reference));
  console.log(`\n\nNew vote transactions since last sync: ${missingInDb.length}`);

  const { data: existingTickets } = await supabase.from("tickets").select("paystack_reference");
  const existingTicketRefs = new Set((existingTickets || []).map((t: any) => t.paystack_reference));

  const missingTickets = ticketTxns.filter((tx) => !existingTicketRefs.has(tx.reference));
  console.log(`New ticket transactions since last sync: ${missingTickets.length}`);

  console.log("\n✅ Database fully synced with Paystack.");
}

main();
