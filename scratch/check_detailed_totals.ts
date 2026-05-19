import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VOTE_RESET_TIMESTAMP = "2026-04-18T14:13:00.000Z";
const FINALISTS = [
  "rotimi-john-olufela",
  "nisola",
  "owofadeju-mayowa",
  "bikom-helen",
  "eniola-busayo",
  "olutoki-oyinkansola",
];

async function checkDetailedTotals() {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .in("contestant_slug", FINALISTS);

  if (error) {
    console.error(error);
    return;
  }

  const resetCutoff = Date.parse(VOTE_RESET_TIMESTAMP);
  
  const results = FINALISTS.map(slug => {
    const rawVotes = data.filter(v => v.contestant_slug === slug).reduce((sum, v) => sum + v.votes, 0);
    const postResetVotes = data.filter(v => v.contestant_slug === slug && Date.parse(v.created_at) >= resetCutoff).reduce((sum, v) => sum + v.votes, 0);
    return { slug, rawVotes, postResetVotes };
  });

  console.table(results);
}

checkDetailedTotals().catch(console.error);
