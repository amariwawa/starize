import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    node_env: process.env.NODE_ENV,
    has_paystack_key: !!process.env.PAYSTACK_SECRET_KEY,
    has_resend_key: !!process.env.RESEND_API_KEY,
    has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    has_supabase_key: !!process.env.SUPABASE_SERVICE_KEY,
    paystack_key_length: process.env.PAYSTACK_SECRET_KEY?.length || 0,
    resend_key_length: process.env.RESEND_API_KEY?.length || 0,
  };

  return NextResponse.json({ ok: true, checks });
}
