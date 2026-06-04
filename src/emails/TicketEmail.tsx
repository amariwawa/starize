import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TicketEmailProps {
  buyerName: string;
  ticketTier: string;
  ticketCode: string;
  eventName: string;
  eventDate: string;
}

export default function TicketEmail({
  buyerName,
  ticketTier,
  ticketCode,
  eventName,
  eventDate,
}: TicketEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {eventName} ticket is here!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your Ticket is Ready!</Heading>

          <Text style={greeting}>Hi {buyerName},</Text>
          <Text style={bodyText}>
            Thank you for purchasing a <strong>{ticketTier}</strong> ticket for{" "}
            <strong>{eventName}</strong>.
          </Text>

          <Section style={ticketSection}>
            <Text style={label}>Ticket Code</Text>
            <Text style={code}>{ticketCode}</Text>
            <Text style={label}>Event</Text>
            <Text style={detail}>{eventName}</Text>
            <Text style={label}>Date</Text>
            <Text style={detail}>{eventDate}</Text>
            <Text style={label}>Tier</Text>
            <Text style={detail}>{ticketTier}</Text>
          </Section>

          <Text style={bodyText}>
            Present this ticket at the venue entrance. See you there!
          </Text>

          <Text style={bodyText}>
            Your ticket image is attached to this email. Please save or print it for entry at the venue.
          </Text>

          <Text style={footer}>
            If you have any questions, reply to this email or contact Starize support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  padding: "20px 0",
};

const container = {
  backgroundColor: "#111111",
  border: "1px solid #333333",
  borderRadius: "12px",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "520px",
};

const heading = {
  color: "#f2ca50",
  fontSize: "24px",
  fontWeight: "700",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const greeting = {
  color: "#ffffff",
  fontSize: "16px",
  marginBottom: "8px",
};

const bodyText = {
  color: "#cccccc",
  fontSize: "15px",
  lineHeight: "1.6",
  marginBottom: "16px",
};

const ticketSection = {
  backgroundColor: "#1a1a1a",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const label = {
  color: "#888888",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  marginBottom: "4px",
  marginTop: "12px",
  textTransform: "uppercase" as const,
};

const code = {
  color: "#f2ca50",
  fontSize: "22px",
  fontWeight: "800",
  letterSpacing: "0.15em",
  marginBottom: "8px",
};

const detail = {
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
};

const footer = {
  color: "#666666",
  fontSize: "12px",
  marginTop: "24px",
  textAlign: "center" as const,
};
