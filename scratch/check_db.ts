
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const contestants = [
  'rotimi-john-olufela',
  'nisola',
  'owofadeju-mayowa',
  'bikom-helen',
  'eniola-busayo',
  'olutoki-oyinkansola',
];

async function check() {
  const { data, error } = await supabase
    .from('votes')
    .select('contestant_slug, votes, paystack_reference, created_at')
    .in('contestant_slug', contestants);

  if (error) {
    console.error('Error fetching votes:', error);
    return;
  }

  const summary = contestants.reduce((acc, slug) => {
    acc[slug] = { count: 0, total_votes: 0 };
    return acc;
  }, {} as Record<string, { count: number, total_votes: number }>);

  data?.forEach((v) => {
    if (summary[v.contestant_slug]) {
      summary[v.contestant_slug].count += 1;
      summary[v.contestant_slug].total_votes += v.votes;
    }
  });

  console.log('Current Vote Summary:');
  console.log(JSON.stringify(summary, null, 2));
  
  // Also check transactions since 3:13 PM
  const cutoff = new Date('2026-04-18T15:13:00+01:00').toISOString();
  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('reference, metadata, paid_at')
    .gte('paid_at', cutoff);
    
  if (txError) {
     console.error('Error fetching transactions:', txError);
  } else {
     console.log(`Found ${txs?.length || 0} transactions in DB since 3:13 PM`);
  }
}

check();
