import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT =
  'linear-gradient(135deg, rgb(68,15,195) 0%, rgb(158,38,182) 50%, rgb(232,68,106) 100%)'

export const metadata: Metadata = {
  title: 'Chia Charged | Contact Us',
  description:
    'Got a question about Chia Charged? Reach out — we respond fast. Orders, wholesale, partnerships or just saying hi.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        fontFamily: FONT,
        backgroundColor: '#f5efe4',
        backgroundImage: "url('/texture.webp')",
        backgroundSize: '280px 280px',
      }}
    >
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden border-b-4 border-black pb-16 pt-32 md:pb-24 md:pt-44"
          style={{ background: GRADIENT }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[6%] -top-[8%] select-none"
            style={{
              fontSize: '32rem',
              lineHeight: 0.8,
              fontFamily: FONT,
              fontWeight: 900,
              color: 'rgba(255,255,255,0.05)',
            }}
          >
            HI
          </div>

          <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
            <h1
              className="mb-4 text-[3.5rem] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[5.5rem] lg:text-[7rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              Get In Touch.
            </h1>
            <p
              className="max-w-xl text-sm font-black uppercase tracking-[0.12em] text-white/80"
              style={{ fontFamily: FONT, fontWeight: 900 }}
            >
              Questions about your order, wholesale, or just want to say hi? We respond within 24h.
            </p>
          </div>
        </section>

        {/* Contact cards */}
        <section
          className="py-20 md:py-28"
          style={{
            backgroundColor: '#f5efe4',
            backgroundImage: "url('/texture.webp')",
            backgroundSize: '280px 280px',
          }}
        >
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  label: 'Email Us',
                  value: 'contact@chiacharged.com',
                  href: 'mailto:contact@chiacharged.com',
                  desc: 'For orders, questions and everything else.',
                  rotate: '-1deg',
                },
                {
                  label: 'Instagram',
                  value: '@chiacharged',
                  href: 'https://instagram.com/chiacharged',
                  desc: 'Follow for tips, new drops and behind the scenes.',
                  rotate: '0.8deg',
                },
                {
                  label: 'Response Time',
                  value: '< 24h',
                  href: null,
                  desc: "We're a small team that actually reads every message.",
                  rotate: '-0.5deg',
                },
              ].map(({ label, value, href, desc, rotate }) => (
                <div
                  key={label}
                  className="flex flex-col gap-4 border-4 border-black bg-white p-7 transition-all duration-300"
                  style={{
                    boxShadow: '8px 8px 0 #111',
                    transform: `rotate(${rotate})`,
                  }}
                >
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.2em]"
                    style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
                  >
                    {label}
                  </span>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noreferrer' : undefined}
                      className="text-xl font-black uppercase transition-opacity hover:opacity-70"
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        background: GRADIENT,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {value}
                    </a>
                  ) : (
                    <span
                      className="text-xl font-black uppercase"
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        background: GRADIENT,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {value}
                    </span>
                  )}
                  <p
                    className="text-sm font-semibold leading-relaxed"
                    style={{ color: 'rgba(0,0,0,0.45)' }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
