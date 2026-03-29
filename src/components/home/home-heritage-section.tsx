export default function HomeHeritageSection() {
  return (
    <section id="about" style={{ background: "#f0eeff" }} className="overflow-hidden">
      <div className="relative h-56 md:h-64 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1600&q=80&auto=format&fit=crop"
          alt="Healthy food lifestyle"
          className="h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(240,238,255,0.55) 0%, rgba(240,238,255,0.88) 100%)" }}
        />

        {/* Stats overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-0 divide-x divide-violet-200 px-6">
            {[
              { stat: "500+", label: "Happy Customers" },
              { stat: "22g",  label: "Protein Per Serving" },
              { stat: "100%", label: "Natural Ingredients" },
              { stat: "4.8★", label: "Average Rating" },
            ].map(({ stat, label }) => (
              <div key={label} className="flex flex-col items-center px-6 py-2 text-center sm:px-10">
                <span
                  className="text-3xl font-black text-slate-900 sm:text-4xl"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
                >
                  {stat}
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
