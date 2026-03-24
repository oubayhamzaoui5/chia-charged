const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarra B.",
    location: "Tunis",
    rating: 5,
    quote: "Obsessed with the strawberry flavor. It's my go-to post-workout meal — tastes like dessert but actually fills me up.",
  },
  {
    id: 2,
    name: "Mehdi K.",
    location: "Sfax",
    rating: 5,
    quote: "Finally a healthy snack that doesn't taste like cardboard. The chocolate chips one is unreal.",
  },
  {
    id: 3,
    name: "Nour A.",
    location: "Sousse",
    rating: 5,
    quote: "22g of protein in something that tastes this good? I've been ordering every week since my first jar.",
  },
  {
    id: 4,
    name: "Rami H.",
    location: "Monastir",
    rating: 5,
    quote: "Clean ingredients, fast delivery, and genuinely delicious. Chia Charged is the real deal.",
  },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400" : "text-slate-200"}`}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section style={{ background: "#f8f6ff" }} className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Happy Customers
          </p>
          <h2
            className="text-3xl font-black text-slate-900 md:text-4xl"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Real People. Real Results.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <Stars rating={t.rating} />
              <blockquote className="flex-1 text-sm leading-relaxed text-slate-600">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "rgb(124,58,237)" }}
                >
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.location}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
