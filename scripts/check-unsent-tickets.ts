import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const { data: unsent, error } = await supabase
    .from("tickets")
    .select("*")
    .is("email_sent_at", null);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Unsent tickets: ${unsent?.length || 0}\n`);

  for (const t of unsent || []) {
    console.log(`${t.paystack_reference} | ${t.buyer_email || t.email} | ${t.tier} | qty: ${t.quantity || 1} | created: ${t.created_at}`);
  }
}

main();
