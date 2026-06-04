import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

export async function GET() {
  const results: any = { steps: [] };

  try {
    // Step 1: Env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    results.steps.push({ step: "env", url: !!url, key: !!key, resend: !!resendKey });

    // Step 2: Supabase connection
    const supabase = createClient(url!, key!);
    const { data, error } = await supabase.from("tickets").select("count").single();
    results.steps.push({ step: "supabase", error: error?.message || null, count: data });

    // Step 3: File system
    const imagePath = path.join(process.cwd(), "public", "tickets", "regular-ticket.png");
    const exists = fs.existsSync(imagePath);
    results.steps.push({ step: "fs", exists, cwd: process.cwd() });

    // Step 4: Resend init
    const resend = new Resend(resendKey!);
    results.steps.push({ step: "resend", ok: true });

    // Step 5: List unsent tickets
    const { data: tickets, error: tErr } = await supabase
      .from("tickets")
      .select("paystack_reference, buyer_email, email_sent_at")
      .is("email_sent_at", null)
      .limit(5);
    results.steps.push({ step: "unsent", error: tErr?.message || null, count: tickets?.length || 0, samples: tickets });

    results.success = true;
  } catch (err: any) {
    results.success = false;
    results.error = err.message;
    results.stack = err.stack;
  }

  return NextResponse.json(results);
}
