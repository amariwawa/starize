"use client";

import type { Contestant } from "@/lib/contestants";

type SelectContestantProps = {
  contestants: Contestant[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

const SelectContestant = ({
  contestants,
  selectedSlug,
  onSelect,
}: SelectContestantProps) => {
  const selectedContestant =
    contestants.find((contestant) => contestant.slug === selectedSlug) ??
    contestants[0];

  if (!selectedContestant) {
    return null;
  }

  return (
    <section className="mb-12">
      <label className="block text-xs font-bold uppercase text-primary mb-3 tracking-[0.2em]">
        Select Contestant
      </label>
      <div className="bg-surface-container-low rounded-2xl border border-white/5 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-5 items-center mb-5">
          <div className="w-[120px] h-[120px] rounded-xl overflow-hidden border border-white/10">
            <img
              src={selectedContestant.image}
              alt={selectedContestant.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">
              You Are Voting For
            </p>
            <h3 className="text-2xl md:text-3xl font-headline font-black text-on-surface">
              {selectedContestant.name}
            </h3>
            <p className="text-on-surface-variant text-sm mt-1">
              {selectedContestant.category}
            </p>
          </div>
        </div>

        <div className="relative">
          <select
            value={selectedContestant.slug}
            onChange={(event) => onSelect(event.target.value)}
            className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-4 py-3 text-on-surface text-sm font-medium appearance-none"
          >
            {contestants.map((contestant) => (
              <option key={contestant.slug} value={contestant.slug}>
                {contestant.name}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            keyboard_arrow_down
          </span>
        </div>
      </div>
    </section>
  );
};

export default SelectContestant;
