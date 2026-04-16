import App from "@/App";
import Hero from "@/components/Hero";
import AboutContent from "@/components/About"; // Renamed to avoid conflict

export default function Home() {
  return (
    <App>
      <Hero />
      <AboutContent />
    </App>
  );
}
// Production Pulse: v1.0.1 - Thu Apr 16 04:59:15 WAT 2026
