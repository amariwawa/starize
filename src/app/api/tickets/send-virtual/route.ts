import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL;

  if (!SENDGRID_API_KEY || !EMAIL_FROM) {
    console.error(
      "Virtual ticket email route is not configured. Set SENDGRID_API_KEY and EMAIL_FROM.",
    );
    return NextResponse.json(
      {
        error:
          "Email service is not configured. Please set SENDGRID_API_KEY and EMAIL_FROM.",
      },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const {
      full_name,
      email,
      tier_label,
      quantity,
      total_amount_naira,
      contestant_name,
      contestant_slug,
      paystack_reference,
    } = body as {
      full_name: string;
      email: string;
      tier_label: string;
      quantity: number;
      total_amount_naira: number;
      contestant_name: string;
      contestant_slug: string;
      paystack_reference: string;
    };

    // Map ticket amount to image filename
    const imageMap: Record<number, string> = {
      1000: "1000.jpeg",
      2500: "2500.jpeg",
      3500: "3500.jpeg",
      25000: "25000.jpeg",
    };

    const imageName =
      imageMap[total_amount_naira] || imageMap[1000] || "1000.jpeg";
    const imageUrl = `https://starize.vercel.app/images/events/${imageName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h1 style="color:#0f172a;">Your Starize Virtual Ticket</h1>
        <p>Hi ${full_name},</p>
        <p>Thank you for purchasing a ticket to the Grand Finale. Your virtual ticket is below.</p>
        <img src="${imageUrl}" alt="${tier_label} Ticket" style="max-width:100%; height:auto; margin:20px 0; border-radius:8px;" />
        <div style="border:1px solid #e5e7eb; padding:20px; border-radius:16px; background:#f8fafc;">
          <h2 style="margin-top:0;">${tier_label} Ticket</h2>
          <p><strong>Supporting:</strong> ${contestant_name}</p>
          <p><strong>Quantity:</strong> ${quantity}</p>
          <p><strong>Total:</strong> ₦${total_amount_naira.toLocaleString()}</p>
          <p><strong>Ticket ID:</strong> ${paystack_reference}</p>
          <p><strong>Event:</strong> Stage 3 — Knockout Edition</p>
        </div>
        <p style="margin-top:18px;">Use this ticket ID at the venue or keep it for your records.</p>
        <p style="font-size:14px; color:#475569;">You are supporting <strong>${contestant_name}</strong> by buying this ticket.</p>
        <p style="margin-top:24px;">See you there!</p>
        <p style="color:#334155; font-size:14px;">Starize Events</p>
      </div>
    `;

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: "Your Starize Virtual Ticket",
          },
        ],
        from: { email: EMAIL_FROM, name: "Starize" },
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error("SendGrid email failed:", bodyText);
      return NextResponse.json(
        { error: "Failed to send virtual ticket email." },
        { status: 500 },
      );
    }

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.error("Virtual ticket email exception:", error);
    return NextResponse.json(
      { error: "Failed to send virtual ticket email." },
      { status: 500 },
    );
  }
}
