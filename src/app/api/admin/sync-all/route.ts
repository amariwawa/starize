import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { generateTicketCode } from "@/lib/generateTicketCode";
import TicketEmail from "@/emails/TicketEmail";

const TICKET_IMAGE_MAP: Record<string, string> = {
  regular: "regular-ticket.png",
  vip: "vip-ticket.png",
  vip_table: "table-of-4-ticket.png",
};

const VOTE_CUTOFF = new Date("2026-05-29T23:00:00.000Z").getTime();

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

export async function POST() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing PAYSTACK_SECRET_KEY" },
      { status: 500 }
    );
  }

  let supabase: any = null;
  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    } catch (e: any) {
      console.error("Sync-all: Supabase init failed:", e.message);
    }
  }

  const summary = {
    totalTransactionsFetched: 0,
    totalSuccessful: 0,
    votesUpserted: 0,
    votesSkippedBeforeCutoff: 0,
    ticketsUpserted: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [] as string[],
    voteByContestant: {} as Record<string, number>,
    ticketByTier: {} as Record<string, number>,
  };

  try {
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.paystack.co/transaction?perPage=${perPage}&page=${page}&from=2026-05-01T00:00:00.000Z`,
        {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        summary.errors.push(`Paystack API error: ${response.status}`);
        break;
      }

      const result = await response.json();
      const transactions = result.data || [];
      if (transactions.length === 0) break;

      for (const tx of transactions) {
        summary.totalTransactionsFetched++;
        if (tx.status !== "success") continue;
        summary.totalSuccessful++;

        const reference = tx.reference || "";
        const email = tx.customer?.email;
        const amount = tx.amount / 100;
        const metadata = tx.metadata || {};

        // Log to transactions (non-blocking)
        if (supabase) {
          try {
            await supabase.from("transactions").upsert({
              reference,
              email,
              amount,
              status: tx.status,
              paid_at: tx.paid_at,
              metadata,
              channel: tx.channel,
              currency: tx.currency,
            }, { onConflict: "reference" });
          } catch (e: any) {
            // silently fail
          }
        }

        const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
        const isVote = paymentType === "vote" || paymentType === "voting" || reference.startsWith("vote_");
        const isTicket = paymentType === "ticket" || reference.startsWith("ticket_");

        if (isVote) {
          const paidAt = tx.paid_at ? new Date(tx.paid_at).getTime() : 0;
          if (paidAt < VOTE_CUTOFF) {
            summary.votesSkippedBeforeCutoff++;
            continue;
          }

          let contestantSlug = getMetaField(metadata, "contestant_slug") || getMetaField(metadata, "slug");
          if (!contestantSlug && reference.startsWith("vote_")) {
            const parts = reference.split("_");
            if (parts.length >= 2) contestantSlug = parts[1];
          }

          if (!contestantSlug) {
            summary.errors.push(`Vote: no slug for ${reference}`);
            continue;
          }

          const votes = parseInt(getMetaField(metadata, "votes") || "0", 10) || Math.floor(amount / 50);

          if (supabase) {
            try {
              await supabase.from("votes").upsert({
                full_name: getMetaField(metadata, "full_name") || "Unknown",
                email,
                contestant_slug: contestantSlug,
                contestant_name: getMetaField(metadata, "contestant") || "Unknown",
                votes,
                amount_naira: amount,
                paystack_reference: reference,
                payment_channel: tx.channel,
              }, { onConflict: "paystack_reference" });
              summary.votesUpserted += votes;
              summary.voteByContestant[contestantSlug] = (summary.voteByContestant[contestantSlug] || 0) + votes;
            } catch (e: any) {
              summary.errors.push(`Vote upsert ${reference}: ${e.message}`);
            }
          }
        } else if (isTicket) {
          let tier = getMetaField(metadata, "ticket_tier") || getMetaField(metadata, "tier") || "regular";
          if (tier === "unknown" && reference.startsWith("ticket_")) {
            const parts = reference.split("_");
            if (parts.length >= 2) tier = parts[1];
          }

          const buyerName = getMetaField(metadata, "full_name") || getMetaField(metadata, "name") || "Valued Guest";
          const tierLabel = getMetaField(metadata, "tier_label") || (tier === "vip_table" ? "Table of 4" : tier.charAt(0).toUpperCase() + tier.slice(1));
          const eventName = metadata.eventName || "Starize S7 Grand Finale";
          const eventDate = metadata.eventDate || "Saturday, 6th June 2026";
          const qty = Math.max(1, parseInt(getMetaField(metadata, "quantity") || "1", 10));

          // Generate quantity ticket codes
          const ticketCodes: string[] = [];
          for (let i = 0; i < qty; i++) {
            ticketCodes.push(generateTicketCode());
          }

          // Check if already saved (to avoid re-sending email)
          let alreadyEmailed = false;
          if (supabase) {
            try {
              const { data: existing } = await supabase
                .from("tickets")
                .select("email_sent_at")
                .eq("paystack_reference", reference)
                .single();
              if (existing?.email_sent_at) alreadyEmailed = true;
            } catch (e) {
              // ignore
            }
          }

          if (supabase) {
            try {
              await supabase.from("tickets").upsert({
                paystack_reference: reference,
                buyer_name: buyerName,
                buyer_email: email,
                ticket_tier: tier,
                ticket_code: ticketCodes.join(", "),
                event_name: eventName,
                event_date: eventDate,
                status: "active",
                full_name: buyerName,
                email,
                tier,
                tier_label: tierLabel,
                quantity: qty,
                unit_price_naira: amount / qty,
                total_amount_naira: amount,
                payment_channel: tx.channel,
                referral: getMetaField(metadata, "referral") || "Nil",
              }, { onConflict: "paystack_reference" });
              summary.ticketsUpserted++;
              summary.ticketByTier[tier] = (summary.ticketByTier[tier] || 0) + qty;
            } catch (e: any) {
              summary.errors.push(`Ticket upsert ${reference}: ${e.message}`);
            }
          }

          // Send email if not already sent
          if (RESEND_API_KEY && email && !alreadyEmailed) {
            try {
              const resend = new Resend(RESEND_API_KEY);
              const imageFileName = TICKET_IMAGE_MAP[tier] || "regular-ticket.png";
              const imagePath = path.join(process.cwd(), "public", "tickets", imageFileName);

              let imageBuffer: Buffer | null = null;
              try {
                imageBuffer = fs.readFileSync(imagePath);
              } catch (e) {
                // ignore
              }

              const attachments: any[] = [];
              if (imageBuffer) {
                attachments.push({ filename: imageFileName, content: imageBuffer.toString("base64") });
              }

              const { data, error: emailError } = await resend.emails.send({
                from: "Starize <tickets@starize.site>",
                to: email,
                subject: qty > 1
                  ? `Your ${eventName} Tickets — ${qty}x ${tierLabel}`
                  : `Your ${eventName} Ticket — ${ticketCodes[0]}`,
                react: TicketEmail({
                  buyerName,
                  ticketTier: tierLabel,
                  ticketCodes,
                  quantity: qty,
                  eventName,
                  eventDate,
                }),
                attachments: attachments.length > 0 ? attachments : undefined,
              });

              if (emailError) {
                console.error(`Sync-all: ❌ Resend rejected for ${reference}:`, JSON.stringify(emailError));
                summary.errors.push(`Email ${reference}: ${JSON.stringify(emailError)}`);
                summary.emailsFailed++;
              } else {
                console.log(`Sync-all: ✅ Accepted by Resend to ${email}, msgId=${data?.id}`);
                summary.emailsSent++;
                if (supabase) {
                  try {
                    await supabase
                      .from("tickets")
                      .update({ email_sent_at: new Date().toISOString() })
                      .eq("paystack_reference", reference);
                  } catch (e) {
                    // ignore
                  }
                }
              }
            } catch (e: any) {
              summary.errors.push(`Email ${reference}: ${e.message}`);
              summary.emailsFailed++;
            }
          }
        }
      }

      if (transactions.length < perPage) break;
      page++;
    }

    return NextResponse.json({ success: true, summary });
  } catch (err: any) {
    console.error("Sync-all error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
