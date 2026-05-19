import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VOTE_RESET_TIMESTAMP = "2026-04-18T14:12:00.000Z";
const RESET_CONTESTANT_SLUGS = [
  "rotimi-john-olufela",
  "nisola",
  "owofadeju-mayowa",
  "bikom-helen",
  "eniola-busayo",
  "olutoki-oyinkansola",
];

async function checkTotals() {
  console.log("Checking current vote totals for specific contestants...");
  
  const { data, error } = await supabase
    .from("votes")
    .select("contestant_slug, contestant_name, votes, created_at")
    .in("contestant_slug", RESET_CONTESTANT_SLUGS);

  if (error) {
    console.error("Error fetching votes:", error);
    return;
  }

  const totals: Record<string, number> = {};
  const resetCutoff = Date.parse(VOTE_RESET_TIMESTAMP);

  for (const row of data) {
    const voteTime = Date.parse(row.created_at);
    if (voteTime < resetCutoff) continue;

    totals[row.contestant_slug] = (totals[row.contestant_slug] || 0) + row.votes;
  }

  console.log("\n--- Current Vote Totals (Post-Reset) ---");
  RESET_CONTESTANT_SLUGS.forEach(slug => {
    console.log(`${slug}: ${totals[slug] || 0}`);
  });
  console.log("----------------------------------------\n");
}

checkTotals().catch(console.error);
