
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const contestants = [
  'nisola',
];

const VOTE_RESET_TIMESTAMP = "2026-04-18T14:12:00.000Z";

async function check() {
  const { data, error } = await supabase
    .from('votes')
    .select('paystack_reference, votes, created_at')
    .eq('contestant_slug', 'nisola')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching votes:', error);
    return;
  }

  const resetTime = new Date(VOTE_RESET_TIMESTAMP).getTime();
  
  let validVotes = 0;
  let invalidVotes = 0;
  
  data?.forEach((v) => {
    const voteTime = new Date(v.created_at).getTime();
    if (voteTime >= resetTime) {
      validVotes += v.votes;
    } else {
      invalidVotes += v.votes;
    }
  });

  console.log(`Summary for Nisola:`);
  console.log(`Total Votes in DB: ${data?.reduce((sum, v) => sum + v.votes, 0)}`);
  console.log(`Valid Votes (>= ${VOTE_RESET_TIMESTAMP}): ${validVotes}`);
  console.log(`Invalid Votes (< ${VOTE_RESET_TIMESTAMP}): ${invalidVotes}`);
  
  console.log('\nLast 5 records for debugging:');
  console.log(JSON.stringify(data?.slice(0, 5), null, 2));
}

check();
