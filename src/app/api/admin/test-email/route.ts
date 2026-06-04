import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import TicketEmail from "@/emails/TicketEmail";

export async function POST(req: Request) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { success: false, error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const { email } = await req.json();
    const targetEmail = email || "test@example.com";

    const resend = new Resend(RESEND_API_KEY);

    // Read ticket image
    const imagePath = path.join(process.cwd(), "public", "tickets", "regular-ticket.png");
    let imageBuffer: Buffer | null = null;
    let imageBase64 = "";
    try {
      imageBuffer = fs.readFileSync(imagePath);
      imageBase64 = imageBuffer.toString("base64");
    } catch (err) {
      console.error("Test email: Failed to read image:", err);
    }

    const attachments: any[] = [];
    if (imageBuffer) {
      attachments.push({
        filename: "regular-ticket.png",
        content: imageBase64,
      });
    }

    const { error: emailError } = await resend.emails.send({
      from: "Starize <tickets@starize.site>",
      to: targetEmail,
      subject: "Test Ticket Email — STR-TEST01",
      react: TicketEmail({
        buyerName: "Test Buyer",
        ticketTier: "Regular",
        ticketCode: "STR-TEST01",
        eventName: "Starize S7 Grand Finale",
        eventDate: "Saturday, 6th June 2026",
        ticketImageBase64: imageBase64,
      }),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${targetEmail}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
