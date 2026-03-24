'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

import type { BlogPostPreview } from '@/types/post.types'

type HomeLatestBlogsSectionProps = {
  posts: BlogPostPreview[]
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function estimateReadingTime(excerpt: string) {
  const words = excerpt ? excerpt.split(' ').length : 0
  return Math.max(1, Math.ceil(words / 60))
}

export default function HomeLatestBlogsSection({ posts }: HomeLatestBlogsSectionProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const scrollByCard = (direction: 'left' | 'right') => {
    const slider = sliderRef.current
    if (!slider) return
    const firstCard = slider.querySelector<HTMLElement>('[data-blog-card]')
    if (!firstCard) return
    const gap = parseFloat(window.getComputedStyle(slider).columnGap || '0')
    const delta = (firstCard.getBoundingClientRect().width + gap) * (direction === 'left' ? -1 : 1)
    slider.scrollBy({ left: delta, behavior: 'smooth' })
  }

  if (posts.length === 0) return null

  return (
    <section className="bg-background px-4 py-14 md:py-20">
      <div className="mx-auto max-w-7xl">

        {/* ── Section header ── */}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Inspiration & Conseils
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Derniers articles
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Desktop scroll arrows */}
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => scrollByCard('left')}
                aria-label="Article precedent"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-foreground/15 bg-background text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard('right')}
                aria-label="Article suivant"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-foreground/15 bg-background text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-opacity hover:opacity-75"
            >
              Tout voir
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* ── Slider ── */}
        <div
          ref={sliderRef}
          className="flex gap-5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post) => (
            <div
              key={post.id}
              data-blog-card
              className="w-[80%] shrink-0 snap-start sm:w-[50%] lg:w-[32%]"
            >
              <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
                <article className="flex h-full flex-col">

                  {/* Image */}
                  <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl bg-foreground/5">
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
                      <div className="h-full w-full bg-foreground/10" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col">
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {post.created && <span>{formatDate(post.created)}</span>}
                      {post.excerpt && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {estimateReadingTime(post.excerpt)} min
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="mb-2 line-clamp-2 text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                      Lire l&apos;article
                      <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </article>
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
