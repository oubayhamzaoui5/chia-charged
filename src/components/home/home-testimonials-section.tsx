import Image from 'next/image'

const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah M.",
    handle: "Fitness Coach",
    rating: 5,
    quote:
      "I've tried every protein pudding on the market — Chia Charged is on another level. The texture is perfect and I actually look forward to my post-workout snack now.",
  },
  {
    id: 2,
    name: "James T.",
    handle: "Marathon Runner",
    rating: 5,
    quote:
      "22g of protein and it tastes like dessert? I've been eating this every morning for three months. My energy levels have never been more consistent.",
  },
  {
    id: 3,
    name: "Priya K.",
    handle: "Nutritionist",
    rating: 5,
    quote:
      "Clean label, real ingredients, and the chia gel keeps my clients full for hours. I recommend Chia Charged to everyone who asks me about healthy snacking.",
  },
  {
    id: 4,
    name: "Daniel R.",
    handle: "CrossFit Athlete",
    rating: 5,
    quote:
      "No bloating, no artificial aftertaste — just clean fuel. It's replaced my morning protein shake entirely. The MCT oil kick is real.",
  },
]

const AVATAR_COLORS = [
  { bg: "#EDE9FE", text: "#6D28D9" },
  { bg: "#FCE7F3", text: "#BE185D" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#FEF3C7", text: "#92400E" },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill={i < rating ? "#FBBF24" : "#E2E8F0"} className="h-3.5 w-3.5" aria-hidden>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ t, i }: { t: typeof TESTIMONIALS[0]; i: number }) {
  const avatar = AVATAR_COLORS[i % AVATAR_COLORS.length]
  return (
    <figure className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <Stars rating={t.rating} />
      <blockquote className="flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
          style={{ backgroundColor: avatar.bg, color: avatar.text }}
        >
          {t.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{t.name}</p>
          <p className="text-xs text-slate-400">{t.handle}</p>
        </div>
      </figcaption>
    </figure>
  )
}

export default function HomeTestimonialsSection() {
  const left = TESTIMONIALS.slice(0, 2)
  const right = TESTIMONIALS.slice(2, 4)

  return (
    <section className="bg-[#F6F6F3] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        {/* header */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block rounded-full border border-accent/20 bg-accent/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            Reviews
          </span>
          <h2
            className="text-4xl font-black text-slate-900 md:text-5xl"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Loved by thousands
          </h2>
          <p className="mt-2 text-slate-400">Real people. Real results. Real delicious.</p>
        </div>

        {/* 3-column layout: cards | image | cards */}
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_320px_1fr] lg:grid-cols-[1fr_380px_1fr]">

          {/* left testimonials */}
          <div className="flex flex-col gap-6">
            {left.map((t, i) => (
              <TestimonialCard key={t.id} t={t} i={i} />
            ))}
          </div>

          {/* center: big product image */}
          <div className="relative mx-auto flex w-full flex-col items-center">
            {/* colored backdrop */}
            <div className="relative w-full overflow-hidden rounded-3xl bg-[#7BC67A]" style={{ aspectRatio: '3/4' }}>
              <Image
                src="/product.png"
                alt="Chia Charged product"
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 90vw, 380px"
                priority
              />
              {/* rating badge */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm whitespace-nowrap">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" fill="#FBBF24" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-900">5.0</span>
                <span className="text-xs text-slate-500">· 200+ reviews</span>
              </div>
            </div>
          </div>

          {/* right testimonials */}
          <div className="flex flex-col gap-6">
            {right.map((t, i) => (
              <TestimonialCard key={t.id} t={t} i={i + 2} />
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
