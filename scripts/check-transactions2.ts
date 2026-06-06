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
  const { data: sample, error } = await supabase
    .from("transactions")
    .select("*")
    .limit(5)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("=== Sample transaction ===\n");
  console.log(JSON.stringify(sample?.[0], null, 2));

  // Count vote vs ticket
  const { data: all } = await supabase.from("transactions").select("reference, metadata, amount, created_at");

  let votes = 0;
  let tickets = 0;
  let voteAmount = 0;
  let ticketAmount = 0;

  for (const t of all || []) {
    const meta = t.metadata || {};
    const ref = t.reference || "";
    const isVote = meta.payment_type === "voting" || meta.payment_type === "vote" || ref.startsWith("vote_");
    const isTicket = meta.payment_type === "ticket" || ref.startsWith("ticket_");

    if (isVote) {
      votes++;
      voteAmount += t.amount || 0;
    } else if (isTicket) {
      tickets++;
      ticketAmount += t.amount || 0;
    }
  }

  console.log(`\nVotes: ${votes} records, total amount: N${voteAmount / 100}`);
  console.log(`Tickets: ${tickets} records, total amount: N${ticketAmount / 100}`);

  // Show date range
  const dates = (all || []).map((t) => new Date(t.created_at));
  if (dates.length > 0) {
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    console.log(`\nDate range: ${min.toISOString()} to ${max.toISOString()}`);
  }
}

main();
