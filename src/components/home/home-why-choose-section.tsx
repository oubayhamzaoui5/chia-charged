import { Zap, Leaf, ShieldCheck } from "lucide-react"

const features = [
  {
    icon: Zap,
    stat: "22g",
    unit: "Protein/Serving",
    title: "High Protein, Real Results",
    desc: "Fuel muscle recovery, stay satiated, and power through your day — every single serving.",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  {
    icon: Leaf,
    stat: "12g",
    unit: "Fiber",
    title: "Gut-Friendly Fiber",
    desc: "Chia gel slows digestion, stabilises blood sugar, and keeps you full for hours.",
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
  {
    icon: ShieldCheck,
    stat: "0%",
    unit: "Junk",
    title: "Clean Ingredients Only",
    desc: "No artificial sweeteners. No fillers. No compromises — ever.",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    borderColor: "border-violet-100",
  },
]

export default function HomeWhyChooseSection() {
  return (
    <section style={{ background: "#f8f6ff" }} className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">

        <div className="mb-12 flex flex-col items-center text-center">
          <span
            className="mb-3 inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: "rgba(124,58,237,0.08)", color: "rgb(124,58,237)" }}
          >
            Why Us
          </span>
          <h2
            className="text-4xl font-black text-slate-900 md:text-5xl"
            style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
          >
            Why Choose Chia Charged?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, stat, unit, title, desc, iconColor, iconBg, borderColor }) => (
            <div
              key={title}
              className={`group rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${borderColor}`}
            >
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={2} />
              </div>
              <div className="mb-3 flex items-baseline gap-1">
                <span
                  className="text-4xl font-black text-slate-900"
                  style={{ fontFamily: "var(--font-display, Georgia, serif)" }}
                >
                  {stat}
                </span>
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300">{unit}</span>
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
