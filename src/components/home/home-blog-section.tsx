import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'

import { getAllPublishedPosts } from '@/lib/services/posts.service'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function estimateReadingTime(excerpt: string) {
  const words = excerpt ? excerpt.split(' ').length : 0
  return Math.max(1, Math.ceil(words / 60))
}

export default async function HomeBlogSection() {
  const posts = await getAllPublishedPosts()
  const preview = posts.slice(0, 3)

  if (preview.length === 0) return null

  return (
    <section style={{ background: "#f0eeff" }} className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <span
            className="mb-3 inline-block rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ background: "rgba(124,58,237,0.08)", color: "rgb(124,58,237)" }}
          >
            Le Blog
          </span>
          <h2
            className="text-4xl font-black text-slate-900 md:text-5xl"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            Fuel Your Knowledge
          </h2>
          <p className="mt-2 text-slate-400">Tips, science & stories behind every bite.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Cover image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
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
                  <div
                    className="h-full w-full"
                    style={{ background: 'linear-gradient(135deg, rgb(124,58,237,0.08) 0%, rgb(124,58,237,0.18) 100%)' }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5">
                {/* Meta */}
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                  {post.created && <span>{formatDate(post.created)}</span>}
                  {post.excerpt && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {estimateReadingTime(post.excerpt)} min
                      </span>
                    </>
                  )}
                </div>

                {/* Title */}
                <h3 className="mb-2 line-clamp-2 text-base font-black leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-accent">
                  {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
                    {post.excerpt}
                  </p>
                )}

                {/* CTA */}
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent">
                  Lire l&apos;article
                  <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* View all */}
        {posts.length > 3 && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border-2 border-slate-900 px-7 py-3 text-sm font-bold text-slate-900 transition-all hover:bg-slate-900 hover:text-white"
            >
              Voir tous les articles
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
