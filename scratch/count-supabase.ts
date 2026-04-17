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

async function countRecords() {
  const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  const { count: voteCount } = await supabase.from('votes').select('*', { count: 'exact', head: true });
  const { count: ticketCount } = await supabase.from('tickets').select('*', { count: 'exact', head: true });

  console.log('--- Supabase Record Counts ---');
  console.log('Transactions:', txCount);
  console.log('Votes:', voteCount);
  console.log('Tickets:', ticketCount);
}

countRecords().catch(console.error);
