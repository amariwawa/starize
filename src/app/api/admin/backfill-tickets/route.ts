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

export async function POST() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  try {
    // Fetch all tickets that have never been emailed
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select("*")
      .is("email_sent_at", null);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unsent tickets found. All ticket buyers have been emailed.",
        sent: 0,
        failed: 0,
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failures: string[] = [];

    for (const ticket of tickets) {
      const email = ticket.buyer_email || ticket.email;
      const buyerName = ticket.buyer_name || ticket.full_name || "Valued Guest";
      const tier = ticket.ticket_tier || ticket.tier || "regular";
      const tierLabel =
        ticket.tier_label ||
        (tier === "vip_table" ? "Table of 4" : tier.charAt(0).toUpperCase() + tier.slice(1));
      const eventName = ticket.event_name || "Starize S7 Grand Finale";
      const eventDate = ticket.event_date || "Saturday, 6th June 2026";
      const reference = ticket.paystack_reference;
      let ticketCodes: string[] = [];
      if (ticket.ticket_code) {
        // Support comma-separated codes from multi-ticket purchases
        ticketCodes = ticket.ticket_code.split(", ").filter((c: string) => c.trim());
      }

      // Generate code(s) if missing
      if (ticketCodes.length === 0) {
        const qty = Math.max(1, ticket.quantity || 1);
        for (let i = 0; i < qty; i++) {
          ticketCodes.push(generateTicketCode());
        }
        await supabase
          .from("tickets")
          .update({ ticket_code: ticketCodes.join(", ") })
          .eq("paystack_reference", reference);
      }

      if (!email) {
        failures.push(`${reference}: No email address`);
        failedCount++;
        continue;
      }

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
      } catch (imgErr) {
        console.error(`Backfill: Failed to read ticket image at ${imagePath}:`, imgErr);
      }

      const attachments: any[] = [];
      if (imageBuffer) {
        attachments.push({
          filename: imageFileName,
          content: imageBase64,
        });
      }

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Starize <tickets@starize.site>",
          to: email,
          subject: ticketCodes.length > 1
            ? `Your ${eventName} Tickets — ${ticketCodes.length}x ${tierLabel}`
            : `Your ${eventName} Ticket — ${ticketCodes[0]}`,
          react: TicketEmail({
            buyerName,
            ticketTier: tierLabel,
            ticketCodes,
            quantity: ticketCodes.length,
            eventName,
            eventDate,
          }),
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (emailError) {
          console.error(`Backfill: Email error for ${reference}:`, emailError);
          failures.push(`${reference}: ${JSON.stringify(emailError)}`);
          failedCount++;
        } else {
          await supabase
            .from("tickets")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("paystack_reference", reference);
          sentCount++;
        }
      } catch (err: any) {
        console.error(`Backfill: Exception for ${reference}:`, err.message);
        failures.push(`${reference}: ${err.message}`);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${tickets.length} unsent tickets`,
      sent: sentCount,
      failed: failedCount,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (err: any) {
    console.error("Backfill error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
