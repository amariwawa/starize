import { NextResponse } from "next/server";
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
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing PAYSTACK_SECRET_KEY" },
      { status: 500 }
    );
  }

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  const resend = new Resend(RESEND_API_KEY);

  let sentCount = 0;
  let failedCount = 0;
  const failures: string[] = [];

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
        return NextResponse.json(
          { success: false, error: `Paystack fetch failed: ${response.status}` },
          { status: 500 }
        );
      }

      const result = await response.json();
      const transactions = result.data || [];
      if (transactions.length === 0) break;

      for (const tx of transactions) {
        if (tx.status !== "success") continue;

        const reference = tx.reference || "";
        const metadata = tx.metadata || {};
        const paymentType = getMetaField(metadata, "payment_type") || metadata.type;
        const isTicket =
          paymentType === "ticket" || reference.startsWith("ticket_");

        if (!isTicket) continue;

        const email = tx.customer?.email || getMetaField(metadata, "email") || getMetaField(metadata, "buyer_email");
        if (!email) {
          failures.push(`${reference}: No email found`);
          failedCount++;
          continue;
        }

        const buyerName =
          getMetaField(metadata, "name") ||
          getMetaField(metadata, "full_name") ||
          tx.customer?.first_name ||
          "Valued Guest";

        const tier = getMetaField(metadata, "tier") || getMetaField(metadata, "ticket_tier") || "regular";
        const tierLabel =
          getMetaField(metadata, "tier_label") ||
          (tier === "vip_table" ? "Table of 4" : tier.charAt(0).toUpperCase() + tier.slice(1));
        const eventName = metadata.eventName || "Starize S7 Grand Finale";
        const eventDate = metadata.eventDate || "Saturday, 6th June 2026";
        const qty = Math.max(1, parseInt(getMetaField(metadata, "quantity") || "1", 10));

        // Generate quantity ticket codes
        const ticketCodes: string[] = [];
        for (let i = 0; i < qty; i++) {
          ticketCodes.push(generateTicketCode());
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
          console.error(`Paystack backfill: Failed to read ticket image at ${imagePath}:`, imgErr);
        }

        const attachments: any[] = [];
        if (imageBuffer) {
          attachments.push({
            filename: imageFileName,
            content: imageBase64,
          });
        }

        try {
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
            console.error(`Backfill: ❌ Email rejected by Resend for ${reference}:`, JSON.stringify(emailError));
            failures.push(`${reference}: ${JSON.stringify(emailError)}`);
            failedCount++;
          } else {
            console.log(`Backfill: ✅ Accepted by Resend for ${email}, msgId=${data?.id}, ref=${reference}`);
            sentCount++;
          }
        } catch (err: any) {
          console.error(`Backfill: ❌ Exception for ${reference}:`, err.message);
          failures.push(`${reference}: ${err.message}`);
          failedCount++;
        }
      }

      if (transactions.length < perPage) break;
      page++;
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} ticket emails, ${failedCount} failed`,
      sent: sentCount,
      failed: failedCount,
      failures: failures.length > 0 ? failures : undefined,
    });
  } catch (err: any) {
    console.error("Paystack backfill error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
