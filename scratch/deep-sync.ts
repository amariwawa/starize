import { syncPaystackTransactions } from "../src/lib/sync";

async function runBackfill() {
  console.log("Starting deep sync from Paystack...");
  try {
    // Increase the sync depth to catch everything
    // Since we don't have a full pagination loop yet, let's fetch 100 which is the max perPage
    const count = await syncPaystackTransactions(100);
    console.log(`Successfully synced ${count} transactions.`);
  } catch (error) {
    console.error("Backfill failed:", error);
  }
}

runBackfill();
