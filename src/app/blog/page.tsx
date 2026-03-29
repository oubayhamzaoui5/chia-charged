import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'

import { getAllPublishedPosts } from '@/lib/services/posts.service'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

export const metadata: Metadata = {
  title: 'Chia Charged | Blog',
  description: 'Tips, nutrition science, and stories behind every jar of Chia Charged. Fuel smarter — starting with knowing what you eat.',
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const rotations = ['-1.2deg', '0.7deg', '-0.5deg', '1deg', '-0.8deg', '0.4deg']

export default async function BlogPage() {
  const posts = await getAllPublishedPosts()
  const [featured, ...rest] = posts

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
        {/* Hero header */}
        <section
          className="border-b-3 border-black px-6 pb-16 pt-32 md:pb-20 md:pt-36"
          style={{ background: GRADIENT }}
        >
          <div className="mx-auto max-w-[1400px]">
            <h1
              className="text-[3rem] font-black uppercase leading-[0.85] tracking-tighter text-white md:text-[5rem] lg:text-[7rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              The Blog.
            </h1>
            <p
              className="mt-4 max-w-2xl text-sm font-black uppercase tracking-[0.15em] text-white md:text-base"
              style={{ fontFamily: FONT, fontWeight: 900 }}
            >
              Nutrition science, recipes, and stories to help you fuel smarter every day.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-20">
          {posts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center border-4 border-black bg-white py-24 text-center"
              style={{ boxShadow: '8px 8px 0 #111' }}
            >
              <p
                className="text-lg font-black uppercase tracking-tight"
                style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
              >
                Aucun article publie pour le moment.
              </p>
              <p
                className="mt-2 text-xs font-black uppercase tracking-wider"
                style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.35)' }}
              >
                Revenez bientot pour de nouvelles inspirations.
              </p>
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="group mb-16 block">
                  <article
                    className="grid overflow-hidden bg-white transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 shadow-[8px_8px_0_#111] hover:shadow-[12px_12px_0_#111] md:grid-cols-2"
                    style={{
                      border: '4px solid #111',
                      borderRadius: '8px',
                    }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
                      {featured.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={featured.coverImage}
                          alt={featured.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full min-h-[300px] w-full" style={{ background: GRADIENT }} />
                      )}
                    </div>

                    <div className="flex flex-col justify-center p-8 md:p-10">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span
                          className="border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white"
                          style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '2px 2px 0 #111' }}
                        >
                          A la une
                        </span>
                      </div>

                      <h2
                        className="mb-3 text-xl font-black uppercase leading-[0.95] tracking-tight md:text-2xl lg:text-3xl"
                        style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                      >
                        {featured.title}
                      </h2>

                      {featured.excerpt && (
                        <p
                          className="mb-6 line-clamp-3 text-sm font-semibold leading-relaxed"
                          style={{ color: 'rgba(0,0,0,0.45)' }}
                        >
                          {featured.excerpt}
                        </p>
                      )}

                      <span
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em]"
                        style={{
                          fontFamily: FONT,
                          fontWeight: 900,
                          background: GRADIENT,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        Read Article
                        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'rgb(124,58,237)' }} />
                      </span>
                    </div>
                  </article>
                </Link>
              )}

              {/* Rest of articles */}
              {rest.length > 0 && (
                <>
                  <div className="mb-10 flex items-center gap-4">
                    <h2
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.3)' }}
                    >
                      All Articles
                    </h2>
                    <div className="h-[3px] flex-1 bg-black/10" />
                  </div>

                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post, i) => (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col overflow-hidden bg-white shadow-[8px_8px_0_#111] transition-[transform,box-shadow] duration-300 hover:shadow-[12px_12px_0_#111] [transform:rotate(var(--card-rotate))] hover:[transform:rotate(0deg)_translate(-4px,-4px)]"
                        style={
                          {
                            border: '4px solid #111',
                            borderRadius: '8px',
                            '--card-rotate': rotations[i % rotations.length],
                          } as CSSProperties & { ['--card-rotate']?: string }
                        }
                      >
                        <div className="relative aspect-[16/10] overflow-hidden">
                          {post.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full" style={{ background: GRADIENT }} />
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <h3
                            className="mb-2 line-clamp-2 text-base font-black uppercase leading-snug tracking-tight"
                            style={{ fontFamily: FONT, fontWeight: 900, color: '#111' }}
                          >
                            {post.title}
                          </h3>

                          {post.excerpt && (
                            <p className="mb-4 line-clamp-2 flex-1 text-sm font-semibold leading-relaxed" style={{ color: 'rgba(0,0,0,0.45)' }}>
                              {post.excerpt}
                            </p>
                          )}

                          <span
                            className="mt-auto inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                            style={{
                              fontFamily: FONT,
                              fontWeight: 900,
                              background: GRADIENT,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          >
                            Read Article
                            <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: 'rgb(124,58,237)' }} />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
