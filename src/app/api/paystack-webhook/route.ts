import { NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateTicketCode } from "@/lib/generateTicketCode";
import TicketEmail from "@/emails/TicketEmail";

const TICKET_IMAGE_MAP: Record<string, string> = {
  regular: "regular-ticket.png",
  vip: "vip-ticket.png",
  vip_table: "table-of-4-ticket.png",
};

function getMetaField(metadata: any, name: string): string | null {
  if (!metadata) return null;
  if (metadata[name]) return metadata[name];
  if (metadata.custom_fields) {
    const field = metadata.custom_fields.find(
      (f: any) => f.variable_name === name
    );
    return field ? field.value : null;
  }
  return null;
}

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !PAYSTACK_SECRET_KEY) {
    console.error("Webhook: Missing required environment variables");
    return NextResponse.json({ status: "success" }, { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("Webhook: No signature provided");
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.error("Webhook: Invalid signature");
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    const body = JSON.parse(rawBody);
    const event = body.event;
    const data = body.data;

    if (event !== "charge.success") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const reference = data.reference;
    const email = data.customer?.email;
    const amount = data.amount / 100;
    const metadata = data.metadata || {};

    // 1. Log the transaction
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
      }, { onConflict: "reference" });

    if (txError) {
      console.error(`Webhook: Failed to upsert transaction ${reference}:`, txError.message);
    }

    // 2. Route to votes or tickets
    const type = metadata.type || getMetaField(metadata, "payment_type");
    const isVotePattern = reference.startsWith("vote_");
    const isTicketPattern = reference.startsWith("ticket_");

    console.log(`Webhook: Processing ${reference} (type: ${type}, votePattern: ${isVotePattern})`);

    if (type === "vote" || type === "voting" || isVotePattern) {
      let contestantSlug = getMetaField(metadata, "contestant_slug") || getMetaField(metadata, "slug");
      if (!contestantSlug && isVotePattern) {
        const parts = reference.split("_");
        if (parts.length >= 2) contestantSlug = parts[1];
      }

      if (contestantSlug) {
        const voteData = {
          full_name: getMetaField(metadata, "full_name") || "Unknown",
          email,
          contestant_slug: contestantSlug,
          contestant_name: getMetaField(metadata, "contestant") || "Unknown",
          votes: parseInt(getMetaField(metadata, "votes") || "0", 10) || Math.floor(amount / 50),
          amount_naira: amount,
          paystack_reference: reference,
          payment_channel: data.channel,
        };
        const { error: voteError } = await supabase
          .from("votes")
          .upsert(voteData, { onConflict: "paystack_reference" });
        if (voteError) {
          console.error(`Webhook: Failed to upsert vote ${reference}:`, voteError.message);
        } else {
          console.log(`Webhook: Recorded ${voteData.votes} votes for ${contestantSlug}`);
        }
      } else {
        console.warn(`Webhook: Could not identify contestant for ${reference}`);
      }
    } else if (type === "ticket" || isTicketPattern) {
      const buyerName =
      getMetaField(metadata, "name") ||
      getMetaField(metadata, "full_name") ||
      "Valued Guest";
    const tier =
      getMetaField(metadata, "tier") ||
      getMetaField(metadata, "ticket_tier") ||
      "regular";
    const eventName =
      getMetaField(metadata, "eventName") || "Starize S7 Grand Finale";
    const eventDate =
      getMetaField(metadata, "eventDate") || "Saturday, 6th June 2026";
    const tierLabel =
      getMetaField(metadata, "tier_label") ||
      (tier === "vip_table"
        ? "Table of 4"
        : tier.charAt(0).toUpperCase() + tier.slice(1));

    // Generate unique ticket code
    const ticketCode = generateTicketCode();

    // Read ticket image
    const imageFileName = TICKET_IMAGE_MAP[tier] || "regular-ticket.png";
    const imagePath = path.join(
      process.cwd(),
      "public",
      "tickets",
      imageFileName
    );

    let imageBuffer: Buffer | null = null;
    let imageBase64 = "";
    try {
      imageBuffer = fs.readFileSync(imagePath);
      imageBase64 = imageBuffer.toString("base64");
    } catch (err) {
      console.error(`Webhook: Failed to read ticket image at ${imagePath}:`, err);
    }

    // Save to Supabase tickets table (new schema columns)
    const ticketPayload = {
      paystack_reference: reference,
      buyer_name: buyerName,
      buyer_email: email,
      ticket_tier: tier,
      ticket_code: ticketCode,
      event_name: eventName,
      event_date: eventDate,
      status: "active",
      // Also populate legacy columns for compatibility
      full_name: buyerName,
      email: email,
      tier: tier,
      tier_label: tierLabel,
      quantity: parseInt(getMetaField(metadata, "quantity") || "1", 10),
      unit_price_naira: amount / (parseInt(getMetaField(metadata, "quantity") || "1", 10) || 1),
      total_amount_naira: amount,
      payment_channel: data.channel,
      referral: getMetaField(metadata, "referral") || "Nil",
    };

    const { error: ticketError } = await supabase
      .from("tickets")
      .upsert(ticketPayload, { onConflict: "paystack_reference" });

    if (ticketError) {
      console.error(`Webhook: Failed to save ticket ${reference}:`, ticketError.message);
    } else {
      console.log(`Webhook: Ticket saved for ${reference} with code ${ticketCode}`);
    }

    // Send email via Resend
    if (RESEND_API_KEY && email) {
      try {
        const resend = new Resend(RESEND_API_KEY);

        const attachments: any[] = [];
        if (imageBuffer) {
          attachments.push({
            filename: imageFileName,
            content: imageBase64,
          });
        }

        const { error: emailError } = await resend.emails.send({
          from: "Starize <tickets@starize.site>",
          to: email,
          subject: `Your ${eventName} Ticket — ${ticketCode}`,
          react: TicketEmail({
            buyerName,
            ticketTier: tierLabel,
            ticketCode,
            eventName,
            eventDate,
            ticketImageBase64: imageBase64,
          }),
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (emailError) {
          console.error(`Webhook: Failed to send email for ${reference}:`, emailError);
        } else {
          console.log(`Webhook: Email sent to ${email} for ticket ${ticketCode}`);
          // Mark email as sent
          await supabase
            .from("tickets")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("paystack_reference", reference);
        }
      } catch (emailErr: any) {
        console.error(`Webhook: Email error for ${reference}:`, emailErr.message);
      }
    } else {
      console.warn(`Webhook: Skipping email — missing RESEND_API_KEY or email for ${reference}`);
    }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    return NextResponse.json({ status: "success", error: true }, { status: 200 });
  }
}
