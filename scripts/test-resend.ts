import { Resend } from "resend";
import { config } from "dotenv";
config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY!);

async function main() {
  console.log("API Key present:", !!process.env.RESEND_API_KEY);
  try {
    const { data, error } = await resend.emails.send({
      from: "Starize <tickets@starize.site>",
      to: "test@example.com",
      subject: "Test",
      text: "Hello",
    });
    console.log("Result:", JSON.stringify({ data, error }, null, 2));
  } catch (e: any) {
    console.error("Exception:", e.message);
  }
}
main();
