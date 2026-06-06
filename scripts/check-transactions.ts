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
  // Check sample records
  const { data: sample, error } = await supabase
    .from("transactions")
    .select("reference, type, metadata, amount, created_at")
    .limit(10)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("=== Sample transactions ===\n");
  for (const t of sample || []) {
    const meta = t.metadata || {};
    const type = meta.payment_type || meta.type || "unknown";
    console.log(`${t.reference} | type: ${type} | amount: ${t.amount} | created: ${t.created_at}`);
  }

  // Count by type
  const { data: all } = await supabase.from("transactions").select("reference, metadata, created_at");

  const typeCounts: Record<string, number> = {};
  const voteCount = { refs: 0 };

  for (const t of all || []) {
    const meta = t.metadata || {};
    const type = meta.payment_type || meta.type || "unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    const ref = t.reference || "";
    if (ref.startsWith("vote_")) voteCount.refs++;
  }

  console.log("\n=== Type breakdown ===");
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`${type}: ${count}`);
  }
  console.log(`vote_ references: ${voteCount.refs}`);

  // Check date range
  const dates = (all || []).map((t) => new Date(t.created_at));
  if (dates.length > 0) {
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    console.log(`\nDate range: ${min.toISOString()} to ${max.toISOString()}`);
  }
}

main();
