import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getVoteTotals() {
  const { data, error } = await supabase
    .from('votes')
    .select('contestant_slug, contestant_name, votes');

  if (error) {
    console.error('Failed to fetch votes:', error);
    return;
  }

  const totals: Record<string, { name: string; votes: number }> = {};
  for (const row of data) {
    if (!totals[row.contestant_slug]) {
      totals[row.contestant_slug] = { name: row.contestant_name, votes: 0 };
    }
    totals[row.contestant_slug].votes += row.votes;
  }

  const sorted = Object.entries(totals)
    .map(([slug, info]) => ({ slug, name: info.name, totalVotes: info.votes }))
    .sort((a, b) => b.totalVotes - a.totalVotes);

  console.log('--- Current Vote Totals (Before Sync) ---');
  console.table(sorted);
}

getVoteTotals().catch(console.error);
