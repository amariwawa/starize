/**
 * Generates a unique ticket code in the format STR-XXXXXX
 * where X is a random uppercase alphanumeric character.
 */
export function generateTicketCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "STR-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
