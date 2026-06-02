import { NextResponse } from "next/server";
import { syncPaystackTransactions } from "@/lib/sync";

export async function POST() {
  try {
    const processed = await syncPaystackTransactions(200);
    return NextResponse.json({
      success: true,
      message: `Synced ${processed} transactions from Paystack`,
      processed,
    });
  } catch (err: any) {
    console.error("Sync votes error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
