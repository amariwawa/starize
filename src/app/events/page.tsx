import App from "@/App";
import Events from "@/components/Events";
import Sponsors from "@/components/Sponsors";
import Contact from "@/components/Contact";
import TicketPanelLoader from "@/components/TicketPanelLoader";

export default function EventsPage() {
  return (
    <App>
      <main className="pt-24 celestial-bg">
        <section id="events" className="px-8 pt-16 pb-4 md:py-24 max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-primary via-secondary to-primary-container">
            EVENTS
          </h1>
        </section>
        <Events />

        <section id="tickets" className="max-w-7xl mx-auto px-8 pt-16 md:pt-24 text-center">
          <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter mb-4 text-on-surface">
            CLAIM YOUR <span className="text-primary">SPOT</span>
          </h1>
        </section>
        <TicketPanelLoader />
        <Contact />
      </main>
    </App>
  );
}
