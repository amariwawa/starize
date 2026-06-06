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

async function main() {
  const { data: votes, error } = await supabase
    .from("votes")
    .select("paystack_reference, contestant_slug, contestant_name, votes, created_at")
    .gte("created_at", "2026-05-29T23:00:00.000Z")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch votes:", error);
    process.exit(1);
  }

  console.log(`Total vote records in DB: ${votes?.length || 0}\n`);

  // Check for duplicate references
  const refMap: Record<string, any[]> = {};
  for (const v of votes || []) {
    const ref = v.paystack_reference;
    if (!refMap[ref]) refMap[ref] = [];
    refMap[ref].push(v);
  }

  const duplicates = Object.entries(refMap).filter(([_, records]) => records.length > 1);

  console.log("=== DUPLICATE REFERENCE CHECK ===");
  if (duplicates.length === 0) {
    console.log("No duplicate paystack references found.\n");
  } else {
    console.log(`Found ${duplicates.length} duplicate references:\n`);
    for (const [ref, records] of duplicates) {
      console.log(`Reference: ${ref} (${records.length} records)`);
      for (const r of records) {
        console.log(`  -> ${r.contestant_name} | ${r.votes} votes | ${r.created_at}`);
      }
      console.log();
    }
  }

  // Vote totals per contestant
  const totals: Record<string, { name: string; votes: number; records: number }> = {};
  for (const v of votes || []) {
    const slug = v.contestant_slug;
    if (!totals[slug]) {
      totals[slug] = { name: v.contestant_name || slug, votes: 0, records: 0 };
    }
    totals[slug].votes += v.votes;
    totals[slug].records++;
  }

  console.log("=== VOTE TOTALS PER CONTESTANT ===\n");
  const sorted = Object.entries(totals).sort((a, b) => b[1].votes - a[1].votes);
  for (const [slug, info] of sorted) {
    console.log(`${info.name} (${slug}):`);
    console.log(`  Records: ${info.records}`);
    console.log(`  Votes:   ${info.votes}\n`);
  }

  // Check for references with suspiciously high vote counts
  console.log("=== REFERENCES WITH 5+ VOTES ===\n");
  const highVoteRefs = Object.entries(refMap)
    .map(([ref, records]) => ({
      ref,
      totalVotes: records.reduce((sum, r) => sum + r.votes, 0),
      contestant: records[0].contestant_name,
      slug: records[0].contestant_slug,
      createdAt: records[0].created_at,
    }))
    .filter((r) => r.totalVotes >= 5)
    .sort((a, b) => b.totalVotes - a.totalVotes);

  for (const r of highVoteRefs) {
    console.log(`${r.ref}: ${r.totalVotes} votes -> ${r.contestant} (${r.slug}) at ${r.createdAt}`);
  }

  // Specific check around 9:01pm last night (Jun 5, 2026)
  console.log("\n=== VOTES AROUND 9:01PM JUN 5, 2026 ===\n");
  const aroundTime = (votes || []).filter((v) => {
    const t = new Date(v.created_at);
    // Between 8:50pm and 9:15pm UTC+1 on June 5, 2026
    const start = new Date("2026-06-05T19:50:00+01:00");
    const end = new Date("2026-06-05T21:15:00+01:00");
    return t >= start && t <= end;
  });

  console.log(`Found ${aroundTime.length} vote records in that window:\n`);
  for (const v of aroundTime) {
    console.log(`${v.created_at} | ${v.contestant_name} | ${v.votes} votes | ref: ${v.paystack_reference}`);
  }
}

main();
