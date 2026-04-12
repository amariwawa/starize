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
