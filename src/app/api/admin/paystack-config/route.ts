import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  return NextResponse.json({
    hasPublicKey: !!publicKey,
    publicKeyPrefix: publicKey ? publicKey.substring(0, 10) + "..." : null,
    isTestKey: publicKey?.startsWith("pk_test_") || false,
    isLiveKey: publicKey?.startsWith("pk_live_") || false,
  });
}
