import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase env vars");
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

async function main() {
  // Fetch all transactions with vote-related data
  const { data: txns, error } = await supabase
    .from("transactions")
    .select("*")
    .gte("created_at", "2026-05-29T23:00:00.000Z")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch transactions:", error);
    process.exit(1);
  }

  console.log(`Found ${txns?.length || 0} transactions since cutoff.\n`);

  const voteRecords: any[] = [];
  const VOTE_CUTOFF = new Date("2026-05-29T23:00:00.000Z").getTime();

  for (const tx of txns || []) {
    const metadata = tx.metadata || {};
    const reference = tx.reference || "";
    const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
    const isVote =
      paymentType === "voting" ||
      paymentType === "vote" ||
      reference.startsWith("vote_");

    if (!isVote) continue;

    const paidAt = tx.paid_at ? new Date(tx.paid_at).getTime() : 0;
    if (paidAt < VOTE_CUTOFF) continue;

    let slug =
      getMetaField(metadata, "contestant_slug") ||
      getMetaField(metadata, "slug");
    if (!slug && reference.startsWith("vote_")) {
      const parts = reference.split("_");
      if (parts.length >= 2) slug = parts[1];
    }

    if (!slug) continue;

    const amountNaira = tx.amount_naira || tx.amount / 100 || 0;
    const voteCount =
      parseInt(getMetaField(metadata, "votes") || "0", 10) ||
      Math.floor(amountNaira / 50);

    voteRecords.push({
      full_name: getMetaField(metadata, "full_name") || getMetaField(metadata, "name") || "Unknown",
      email: tx.email || getMetaField(metadata, "email") || "",
      contestant_slug: slug,
      contestant_name: getMetaField(metadata, "contestant") || getMetaField(metadata, "full_name") || slug,
      votes: voteCount,
      amount_naira: amountNaira,
      paystack_reference: reference,
      payment_channel: tx.channel || "card",
      created_at: tx.created_at,
    });
  }

  console.log(`Found ${voteRecords.length} vote records to insert.\n`);

  if (voteRecords.length === 0) {
    console.log("No vote records found. Exiting.");
    return;
  }

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < voteRecords.length; i += batchSize) {
    const batch = voteRecords.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from("votes").insert(batch);

    if (insertError) {
      console.error(`Batch ${i / batchSize + 1} insert error:`, insertError.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} records`);
    }
  }

  console.log(`\nTotal inserted: ${inserted} vote records`);

  // Show totals
  const { data: allVotes } = await supabase
    .from("votes")
    .select("contestant_slug, contestant_name, votes");

  const totals: Record<string, { name: string; votes: number }> = {};
  for (const v of allVotes || []) {
    if (!totals[v.contestant_slug]) {
      totals[v.contestant_slug] = { name: v.contestant_name, votes: 0 };
    }
    totals[v.contestant_slug].votes += v.votes;
  }

  console.log("\n=== VOTE TOTALS PER CONTESTANT ===\n");
  const sorted = Object.entries(totals).sort((a, b) => b[1].votes - a[1].votes);
  for (const [slug, info] of sorted) {
    console.log(`${info.name} (${slug}): ${info.votes} votes`);
  }
}

main();
