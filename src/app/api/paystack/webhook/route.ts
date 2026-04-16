import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  saveVote,
  saveTicket,
  isReferenceDuplicate,
} from "@/lib/database";

export async function POST(req: Request) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    console.error("Webhook: Missing PAYSTACK_SECRET_KEY");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    /* ── 1. Read the raw body for signature verification ── */
    const rawBody = await req.text();

    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return NextResponse.json(
        { message: "No signature provided" },
        { status: 401 },
      );
    }

    /* ── 2. Verify HMAC SHA-512 signature ── */
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 },
      );
    }

    /* ── 3. Parse body after verification ── */
    const body = JSON.parse(rawBody);
    const event: string = body.event;
    const data = body.data;

    /* ── 4. Only handle charge.success ── */
    if (event !== "charge.success") {
      return NextResponse.json({ status: "ignored" });
    }

    const reference: string = data.reference;
    const email: string = data.customer?.email ?? "";
    const amountKobo: number = data.amount;
    const metadata = data.metadata ?? {};
    const customFields: Array<{
      variable_name: string;
      value: string;
    }> = metadata.custom_fields ?? [];

    /* Helper to pull a value from Paystack custom_fields */
    const field = (name: string): string =>
      customFields.find((f) => f.variable_name === name)?.value ?? "";

    /* ── 5. Idempotency — skip if reference already recorded ── */
    const isDuplicate = await isReferenceDuplicate(reference);
    if (isDuplicate) {
      console.log(`Webhook: duplicate reference ${reference} — skipping`);
      return NextResponse.json({ status: "duplicate" });
    }

    /* ── 6. Route to the correct table ── */
    const paymentType = field("payment_type");

    if (paymentType === "voting") {
      await saveVote({
        full_name: field("full_name") || "Unknown",
        email,
        contestant_slug: field("contestant_slug") || "unknown",
        contestant_name: field("contestant") || "Unknown",
        votes: parseInt(field("votes") || "0", 10),
        amount_naira: amountKobo / 100,
        paystack_reference: reference,
      });
      console.log(`Webhook: saved vote for ref ${reference}`);
    } else if (paymentType === "ticket") {
      const qty = parseInt(field("quantity") || "1", 10);
      await saveTicket({
        full_name: field("full_name") || "Unknown",
        email,
        tier: field("ticket_tier") || "unknown",
        tier_label: field("tier_label") || "Unknown",
        quantity: qty,
        unit_price_naira: amountKobo / 100 / qty,
        total_amount_naira: amountKobo / 100,
        paystack_reference: reference,
      });
      console.log(`Webhook: saved ticket for ref ${reference}`);
    } else {
      console.warn(
        `Webhook: unknown payment_type "${paymentType}" for ref ${reference}`,
      );
    }

    return NextResponse.json({ status: "success" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
