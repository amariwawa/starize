import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { generateTicketCode } from "../src/lib/generateTicketCode";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !RESEND_API_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

const TICKET_IMAGE_MAP: Record<string, string> = {
  regular: "regular-ticket.png",
  vip: "vip-ticket.png",
  vip_table: "table-of-4-ticket.png",
};

// We need to render the React email component
// Since we can't easily import TSX in a script, we'll use HTML
function buildTicketEmailHtml(buyerName: string, tierLabel: string, ticketCodes: string[], quantity: number, eventName: string, eventDate: string): string {
  const isPlural = quantity > 1;
  const codesHtml = ticketCodes.map((code, i) => `
    <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:8px;padding:16px;margin:12px 0;">
      <p style="margin:0 0 4px 0;font-size:12px;color:#6c757d;">${isPlural ? `Ticket ${i + 1} Code` : "Ticket Code"}</p>
      <p style="margin:0;font-size:24px;font-weight:bold;color:#212529;letter-spacing:2px;">${code}</p>
    </div>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your ${eventName} Ticket${isPlural ? "s" : ""}</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="color:#212529;margin-bottom:8px;">${isPlural ? `Your ${quantity} Tickets are Ready!` : "Your Ticket is Ready!"}</h1>
    <p style="color:#495057;">Hi ${buyerName},</p>
    <p style="color:#495057;">
      Thank you for purchasing <strong>${quantity} ${tierLabel}</strong> ${isPlural ? "tickets" : "ticket"} for <strong>${eventName}</strong>.
    </p>
    <p style="color:#495057;">Here ${isPlural ? "are your ticket codes" : "is your ticket code"}:</p>
    ${codesHtml}
    <p style="color:#495057;margin-top:16px;"><strong>Event:</strong> ${eventName}<br><strong>Date:</strong> ${eventDate}</p>
    <p style="color:#6c757d;font-size:12px;margin-top:24px;">Please keep ${isPlural ? "these codes" : "this code"} safe and present ${isPlural ? "them" : "it"} at the entrance.</p>
  </div>
</body>
</html>`;
}

async function main() {
  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .is("email_sent_at", null);

  if (error) {
    console.error("Error fetching unsent tickets:", error);
    process.exit(1);
  }

  if (!tickets || tickets.length === 0) {
    console.log("No unsent tickets found.");
    return;
  }

  console.log(`Found ${tickets.length} unsent tickets.\n`);

  let sentCount = 0;
  let failedCount = 0;

  for (const ticket of tickets) {
    const email = ticket.buyer_email || ticket.email;
    const buyerName = ticket.buyer_name || ticket.full_name || "Valued Guest";
    const tier = ticket.ticket_tier || ticket.tier || "regular";
    const tierLabel = ticket.tier_label || (tier === "vip_table" ? "Table of 4" : tier.charAt(0).toUpperCase() + tier.slice(1));
    const eventName = ticket.event_name || "Starize S7 Grand Finale";
    const eventDate = ticket.event_date || "Saturday, 6th June 2026";
    const reference = ticket.paystack_reference;
    const qty = Math.max(1, ticket.quantity || 1);

    let ticketCodes: string[] = [];
    if (ticket.ticket_code) {
      ticketCodes = ticket.ticket_code.split(", ").filter((c: string) => c.trim());
    }

    if (ticketCodes.length === 0) {
      for (let i = 0; i < qty; i++) {
        ticketCodes.push(generateTicketCode());
      }
      await supabase
        .from("tickets")
        .update({ ticket_code: ticketCodes.join(", ") })
        .eq("paystack_reference", reference);
    }

    if (!email) {
      console.log(`❌ ${reference}: No email address`);
      failedCount++;
      continue;
    }

    const html = buildTicketEmailHtml(buyerName, tierLabel, ticketCodes, qty, eventName, eventDate);

    try {
      const { data, error: emailError } = await resend.emails.send({
        from: "Starize <tickets@starize.site>",
        to: email,
        subject: qty > 1
          ? `Your ${eventName} Tickets — ${qty}x ${tierLabel}`
          : `Your ${eventName} Ticket — ${ticketCodes[0]}`,
        html,
      });

      if (emailError) {
        console.log(`❌ ${reference}: ${JSON.stringify(emailError)}`);
        failedCount++;
      } else {
        await supabase
          .from("tickets")
          .update({ email_sent_at: new Date().toISOString() })
          .eq("paystack_reference", reference);
        console.log(`✅ ${reference}: Sent to ${email}, msgId=${data?.id}`);
        sentCount++;
      }
    } catch (err: any) {
      console.log(`❌ ${reference}: ${err.message}`);
      failedCount++;
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Sent: ${sentCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Total: ${tickets.length}`);
}

main();
