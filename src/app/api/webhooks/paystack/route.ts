import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PAYSTACK_SECRET_KEY) {
    console.error("Webhook: Missing environment variables");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Webhook: No signature provided");
      return NextResponse.json({ message: "No signature" }, { status: 401 });
    }

    // Verify signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("Webhook: Invalid signature");
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const event = body.event;
    const data = body.data;

    // Only handle charge.success
    if (event !== "charge.success") {
      return NextResponse.json({ status: "ignored" });
    }

    const reference = data.reference;
    const email = data.customer?.email;
    const amount = data.amount / 100;
    const metadata = data.metadata || {};

    // 1. Log the transaction (Upsert)
    const { error: txError } = await supabase
      .from("transactions")
      .upsert({
        reference,
        email,
        amount,
        status: data.status,
        paid_at: data.paid_at,
        metadata,
        channel: data.channel,
        currency: data.currency,
      }, { onConflict: 'reference' });

    if (txError) {
      console.error(`Webhook: Failed to upsert transaction ${reference}:`, txError.message);
    }

    // 2. Perform table routing based on metadata
    // Check both 'type' and 'payment_type' (support v1 and v2 metadata)
    const getMetaField = (name: string) => {
        if (metadata[name]) return metadata[name];
        if (metadata.custom_fields) {
            const f = metadata.custom_fields.find((field: any) => field.variable_name === name);
            return f ? f.value : null;
        }
        return null;
    };

    const type = metadata.type || getMetaField("payment_type");
    const isVotePattern = reference.startsWith("vote_");
    const isTicketPattern = reference.startsWith("ticket_");

    console.log(`Webhook: Processing event ${event} for ${reference} (type: ${type}, patternMatch: ${isVotePattern})`);

    if (type === "vote" || type === "voting" || isVotePattern) {
      // Identify contestant slug via metadata or reference parsing
      let contestantSlug = getMetaField("contestant_slug") || getMetaField("slug");
      
      if (!contestantSlug && isVotePattern) {
        const parts = reference.split("_");
        if (parts.length >= 2) {
          contestantSlug = parts[1];
        }
      }

      if (contestantSlug) {
        const voteData = {
          full_name: getMetaField("full_name") || "Unknown",
          email: email,
          contestant_slug: contestantSlug,
          contestant_name: getMetaField("contestant") || "Unknown",
          votes: parseInt(getMetaField("votes") || "0", 10) || Math.floor(amount / 50),
          amount_naira: amount,
          paystack_reference: reference,
          payment_channel: data.channel,
        };

        console.log(`Webhook: Upserting vote for ${voteData.contestant_slug}: ${voteData.votes} votes`);
        const { error: voteError } = await supabase
          .from("votes")
          .upsert(voteData, { onConflict: 'paystack_reference' });
        
        if (voteError) {
          console.error(`Webhook: Failed to upsert vote for ${reference}:`, voteError.message);
        } else {
          console.log(`Webhook: Successfully recorded vote for ${reference} (${voteData.votes} votes for ${voteData.contestant_slug})`);
        }
      } else {
        console.warn(`Webhook: Failed to identify contestant for vote ref: ${reference}`);
      }
    } else if (type === "ticket" || isTicketPattern) {
      let tier = getMetaField("ticket_tier") || "unknown";
      if (tier === "unknown" && isTicketPattern) {
        const parts = reference.split("_");
        if (parts.length >= 2) tier = parts[1];
      }

      const qty = parseInt(getMetaField("quantity") || "1", 10);
      const ticketData = {
        full_name: getMetaField("full_name") || "Unknown",
        email: email,
        tier: tier,
        tier_label: getMetaField("tier_label") || "Unknown",
        quantity: qty,
        unit_price_naira: amount / qty,
        total_amount_naira: amount,
        paystack_reference: reference,
        payment_channel: data.channel,
      };

      const { error: ticketError } = await supabase
        .from("tickets")
        .upsert(ticketData, { onConflict: 'paystack_reference' });
      
      if (ticketError) {
        console.error(`Webhook: Failed to upsert ticket for ${reference}:`, ticketError.message);
      } else {
        console.log(`Webhook: Successfully recorded ticket for ${reference}`);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    // Always return 200 to prevent Paystack from retrying failing hooks indefinitely
    return NextResponse.json({ status: "success", error: true }, { status: 200 });
  }
}
