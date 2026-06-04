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
    const f = metadata.custom_fields.find((field: any) => field.variable_name === name);
    return f ? f.value : null;
  }
  return null;
}

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  console.log("===== WEBHOOK HIT =====");
  console.log("Has PAYSTACK_SECRET_KEY:", !!PAYSTACK_SECRET_KEY);
  console.log("Has RESEND_API_KEY:", !!RESEND_API_KEY);
  console.log("Has SUPABASE_URL:", !!SUPABASE_URL);
  console.log("Has SUPABASE_SERVICE_KEY:", !!SUPABASE_SERVICE_KEY);

  if (!PAYSTACK_SECRET_KEY) {
    console.error("Webhook: Missing PAYSTACK_SECRET_KEY");
    return NextResponse.json({ status: "success" }, { status: 200 });
  }

  let supabase: any = null;
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    } catch (e: any) {
      console.error("Webhook: Supabase init failed:", e.message);
    }
  }

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
      console.log(`Webhook: Ignoring event ${event}`);
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const reference = data.reference;
    const email = data.customer?.email;
    const amount = data.amount / 100;
    const metadata = data.metadata || {};

    console.log(`Webhook: charge.success for ${reference}, email=${email}`);

    // Log to Supabase (non-blocking)
    if (supabase) {
      try {
        await supabase.from("transactions").upsert({
          reference,
          email,
          amount,
          status: data.status,
          paid_at: data.paid_at,
          metadata,
          channel: data.channel,
          currency: data.currency,
        }, { onConflict: "reference" });
      } catch (e: any) {
        console.error(`Webhook: Supabase tx log failed for ${reference}:`, e.message);
      }
    }

    const type = metadata.type || getMetaField(metadata, "payment_type");
    const isVotePattern = reference.startsWith("vote_");
    const isTicketPattern = reference.startsWith("ticket_");

    console.log(`Webhook: type=${type}, isVote=${isVotePattern}, isTicket=${isTicketPattern}`);

    // ===== VOTES =====
    if (type === "vote" || type === "voting" || isVotePattern) {
      let contestantSlug = getMetaField(metadata, "contestant_slug") || getMetaField(metadata, "slug");
      if (!contestantSlug && isVotePattern) {
        const parts = reference.split("_");
        if (parts.length >= 2) contestantSlug = parts[1];
      }

      if (contestantSlug && supabase) {
        try {
          await supabase.from("votes").upsert({
            full_name: getMetaField(metadata, "full_name") || "Unknown",
            email,
            contestant_slug: contestantSlug,
            contestant_name: getMetaField(metadata, "contestant") || "Unknown",
            votes: parseInt(getMetaField(metadata, "votes") || "0", 10) || Math.floor(amount / 50),
            amount_naira: amount,
            paystack_reference: reference,
            payment_channel: data.channel,
          }, { onConflict: "paystack_reference" });
          console.log(`Webhook: Vote recorded for ${contestantSlug}`);
        } catch (e: any) {
          console.error(`Webhook: Vote save failed for ${reference}:`, e.message);
        }
      }
    }

    // ===== TICKETS =====
    else if (type === "ticket" || isTicketPattern) {
      let tier = getMetaField(metadata, "ticket_tier") || getMetaField(metadata, "tier") || "regular";
      if (tier === "unknown" && isTicketPattern) {
        const parts = reference.split("_");
        if (parts.length >= 2) tier = parts[1];
      }

      const buyerName = getMetaField(metadata, "full_name") || getMetaField(metadata, "name") || "Valued Guest";
      const tierLabel = getMetaField(metadata, "tier_label") || (tier === "vip_table" ? "Table of 4" : tier.charAt(0).toUpperCase() + tier.slice(1));
      const eventName = metadata.eventName || "Starize S7 Grand Finale";
      const eventDate = metadata.eventDate || "Saturday, 6th June 2026";
      const ticketCode = generateTicketCode();

      console.log(`Webhook: Ticket detected — tier=${tier}, buyer=${buyerName}, email=${email}`);

      // 1. SEND EMAIL FIRST (most important)
      if (RESEND_API_KEY && email) {
        try {
          const resend = new Resend(RESEND_API_KEY);

          const imageFileName = TICKET_IMAGE_MAP[tier] || "regular-ticket.png";
          const imagePath = path.join(process.cwd(), "public", "tickets", imageFileName);

          let imageBuffer: Buffer | null = null;
          let imageBase64 = "";
          try {
            imageBuffer = fs.readFileSync(imagePath);
            imageBase64 = imageBuffer.toString("base64");
          } catch (imgErr) {
            console.error(`Webhook: Image read failed: ${imagePath}`);
          }

          const attachments: any[] = [];
          if (imageBuffer) {
            attachments.push({ filename: imageFileName, content: imageBase64 });
          }

          // Try custom domain first, fallback to Resend default
          const fromAddresses = [
            "Starize <tickets@starize.site>",
            "Starize <onboarding@resend.dev>",
          ];

          let emailSent = false;
          for (const fromAddr of fromAddresses) {
            try {
              const { error: emailError } = await resend.emails.send({
                from: fromAddr,
                to: email,
                subject: `Your ${eventName} Ticket — ${ticketCode}`,
                react: TicketEmail({
                  buyerName,
                  ticketTier: tierLabel,
                  ticketCode,
                  eventName,
                  eventDate,
                }),
                attachments: attachments.length > 0 ? attachments : undefined,
              });

              if (!emailError) {
                console.log(`Webhook: ✅ EMAIL SENT to ${email} from ${fromAddr} for ticket ${ticketCode}`);
                emailSent = true;
                break;
              } else {
                console.error(`Webhook: Email failed from ${fromAddr}:`, emailError);
              }
            } catch (innerErr: any) {
              console.error(`Webhook: Email exception from ${fromAddr}:`, innerErr.message);
            }
          }

          if (!emailSent) {
            console.error(`Webhook: ❌ ALL EMAIL ATTEMPTS FAILED for ${reference} to ${email}`);
          }
        } catch (emailErr: any) {
          console.error(`Webhook: ❌ EMAIL CRASH for ${reference}:`, emailErr.message);
        }
      } else {
        console.error(`Webhook: ❌ Cannot send email — RESEND_API_KEY=${!!RESEND_API_KEY}, email=${email}`);
      }

      // 2. Save to Supabase (non-blocking, after email)
      if (supabase) {
        try {
          await supabase.from("tickets").upsert({
            paystack_reference: reference,
            buyer_name: buyerName,
            buyer_email: email,
            ticket_tier: tier,
            ticket_code: ticketCode,
            event_name: eventName,
            event_date: eventDate,
            status: "active",
            full_name: buyerName,
            email: email,
            tier: tier,
            tier_label: tierLabel,
            quantity: parseInt(getMetaField(metadata, "quantity") || "1", 10),
            unit_price_naira: amount / (parseInt(getMetaField(metadata, "quantity") || "1", 10) || 1),
            total_amount_naira: amount,
            payment_channel: data.channel,
            referral: getMetaField(metadata, "referral") || "Nil",
          }, { onConflict: "paystack_reference" });
          console.log(`Webhook: Ticket saved to Supabase for ${reference}`);
        } catch (e: any) {
          console.error(`Webhook: Ticket save failed for ${reference}:`, e.message);
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook: FATAL ERROR:", err.message);
    return NextResponse.json({ status: "success" }, { status: 200 });
  }
}
