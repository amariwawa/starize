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

  // Check for duplicate references
  const refCounts: Record<string, number> = {};
  for (const tx of voteTxns) {
    const ref = tx.reference;
    refCounts[ref] = (refCounts[ref] || 0) + 1;
  }

  const duplicates = Object.entries(refCounts).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate references in Paystack:\n`);
    for (const [ref, count] of duplicates) {
      console.log(`  ${ref}: appears ${count} times`);
    }
  } else {
    console.log("✅ No duplicate references found.\n");
  }

  // Build vote records
  const voteRecords: any[] = [];
  const totals: Record<string, { name: string; votes: number; records: number }> = {};

  for (const tx of voteTxns) {
    const metadata = tx.metadata || {};
    const reference = tx.reference;

    let slug =
      getMetaField(metadata, "contestant_slug") ||
      getMetaField(metadata, "slug");
    if (!slug && reference.startsWith("vote_")) {
      const parts = reference.split("_");
      if (parts.length >= 2) slug = parts[1];
    }

    if (!slug) continue;

    const amountNaira = tx.amount / 100;
    const voteCount =
      parseInt(getMetaField(metadata, "votes") || "0", 10) ||
      Math.floor(amountNaira / 50);

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

    if (!totals[slug]) {
      totals[slug] = { name: getMetaField(metadata, "contestant") || slug, votes: 0, records: 0 };
    }
    totals[slug].votes += voteCount;
    totals[slug].records++;
  }

  console.log("=== VOTE TOTALS FROM PAYSTACK ===\n");
  const sorted = Object.entries(totals).sort((a, b) => b[1].votes - a[1].votes);
  for (const [slug, info] of sorted) {
    console.log(`${info.name} (${slug}): ${info.votes} votes (${info.records} transactions)`);
  }

  // Now populate Supabase
  console.log(`\n\nInserting ${voteRecords.length} vote records into Supabase...`);

  // Clear existing votes first (since they're stale/empty)
  console.log("Clearing existing votes table...");
  await supabase.from("votes").delete().neq("id", 0);

  // Insert in batches
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < voteRecords.length; i += batchSize) {
    const batch = voteRecords.slice(i, i + batchSize);
    const { error } = await supabase.from("votes").insert(batch);

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n✅ Inserted ${inserted} vote records into Supabase`);

  // Verify
  const { count } = await supabase.from("votes").select("*", { count: "exact", head: true });
  console.log(`Votes table now has ${count} records`);
}

main();
