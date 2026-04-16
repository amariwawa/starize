import Link from "next/link";
import { notFound } from "next/navigation";
import App from "@/App";
import { contestants, getContestantBySlug } from "@/lib/contestants";
import LiveVoteCount from "@/components/LiveVoteCount";

type ContestantDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return contestants.map((contestant) => ({
    slug: contestant.slug,
  }));
}

export default async function ContestantDetailPage({
  params,
}: ContestantDetailPageProps) {
  const { slug } = await params;
  const contestant = getContestantBySlug(slug);

  if (!contestant) {
    notFound();
  }

  return (
    <App>
      <main className="pt-28 pb-20 px-8 max-w-7xl mx-auto">
        <section className="mb-8">
          <Link
            href="/contestants"
            className="text-primary text-xs font-bold uppercase tracking-[0.2em]"
          >
            Back to Contestants
          </Link>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-surface-container-low shadow-2xl">
              <img
                src={contestant.image}
                alt={contestant.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <p className="text-primary text-sm font-bold uppercase tracking-widest">
              Contestant Profile
            </p>
            <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tighter text-on-surface">
              {contestant.name}
            </h1>
            <LiveVoteCount contestantSlug={slug} />
            <p className="text-on-surface-variant text-lg">{contestant.category}</p>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              {contestant.writeUp}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/voting?contestant=${contestant.slug}#vote-panel`}
                className="gold-shimmer text-on-primary font-bold py-3 px-7 rounded-lg text-sm uppercase tracking-wider text-center"
              >
                Vote Now
              </Link>
              <Link
                href="/contestants"
                className="bg-surface-container-high border border-white/10 text-on-surface font-bold py-3 px-7 rounded-lg text-sm uppercase tracking-wider text-center"
              >
                See Other Contestants
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low border border-white/5 rounded-2xl p-6 md:p-10">
          <h2 className="text-3xl md:text-4xl font-headline font-black text-on-surface mb-6">
            Performance Video
          </h2>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex flex-col items-center justify-center p-8 text-center">
            <span className="material-symbols-outlined text-primary text-6xl mb-4 opacity-50">
              videocam_off
            </span>
            <p className="text-on-surface-variant font-bold text-lg max-w-md">
              This video will be uploaded after the performance, please check back later, thank you.
            </p>
          </div>
        </section>
      </main>
    </App>
  );
}
