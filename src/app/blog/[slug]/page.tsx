import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'

import ReadingProgress from './_components/reading-progress'
import { getPostBySlug, getAllPublishedPosts } from '@/lib/services/posts.service'
import { Navbar } from '@/components/navbar'
import Footer from '@/components/footer'

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

type BlogPostPageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Chia Charged | Article introuvable',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${post.title} | Chia Charged Blog`,
    description: post.excerpt || post.title,
    openGraph: {
      title: `${post.title} | Chia Charged Blog`,
      description: post.excerpt || post.title,
      type: 'article',
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) notFound()

  // Get other posts for "Read Next" section
  const allPosts = await getAllPublishedPosts()
  const otherPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 2)

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
      <ReadingProgress />

      <main className="flex-1">
        {/* Hero banner with gradient */}
        <section
          className="border-b-3 border-black px-6 pb-16 pt-32 md:pb-20 md:pt-36"
          style={{ background: GRADIENT }}
        >
          <div className="mx-auto max-w-4xl">
            {/* Back nav */}
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-2 border-3 border-black bg-white px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ fontFamily: FONT, fontWeight: 900, boxShadow: '4px 4px 0 #111' }}
            >
              <ArrowLeft size={12} />
              Back to Blog
            </Link>

            {/* Title */}
            <h1
              className="text-[2rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[3rem] lg:text-[4rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.03em' }}
            >
              {post.title}
            </h1>

            {post.excerpt && (
              <p
                className="mt-5 max-w-2xl text-sm font-bold leading-relaxed text-white md:text-base"
                style={{ fontFamily: FONT }}
              >
                {post.excerpt}
              </p>
            )}
          </div>
        </section>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mx-auto -mt-1 max-w-4xl px-6">
            <div
              className="relative -mt-8 aspect-video overflow-hidden border-4 border-black bg-white"
              style={{ boxShadow: '8px 8px 0 #111' }}
            >
              <Image
                src={post.coverImage}
                alt={post.title}
                width={1600}
                height={900}
                unoptimized
                priority
                className="h-auto w-full object-cover"
                sizes="(max-width: 768px) 100vw, 860px"
              />
            </div>
          </div>
        )}

        {/* Article content */}
        <article className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
          <div
            className="overflow-hidden border-4 border-black bg-white p-6 md:p-10 lg:p-14"
            style={{ boxShadow: '8px 8px 0 #111' }}
          >
            <style>{`
              .brutalist-prose h2 {
                font-family: ${FONT};
                font-weight: 900;
                font-size: 1.6rem;
                text-transform: uppercase;
                letter-spacing: -0.02em;
                color: #111;
                margin-top: 2.5rem;
                margin-bottom: 1rem;
                line-height: 0.95;
              }
              .brutalist-prose h3 {
                font-family: ${FONT};
                font-weight: 900;
                font-size: 1.15rem;
                text-transform: uppercase;
                letter-spacing: -0.01em;
                color: #111;
                margin-top: 2rem;
                margin-bottom: 0.75rem;
                line-height: 1;
              }
              .brutalist-prose p {
                font-family: ${FONT};
                font-size: 1.05rem;
                line-height: 1.85;
                color: rgba(0,0,0,0.7);
                margin-bottom: 1.25rem;
              }
              .brutalist-prose strong {
                font-weight: 800;
                color: rgb(232,68,106);
              }
              .brutalist-prose ul, .brutalist-prose ol {
                font-family: ${FONT};
                font-size: 1.05rem;
                line-height: 1.85;
                color: rgba(0,0,0,0.7);
                margin-bottom: 1.25rem;
                padding-left: 1.5rem;
              }
              .brutalist-prose li {
                margin-bottom: 0.5rem;
              }
              .brutalist-prose blockquote {
                border-left: 4px solid #111;
                padding: 1rem 1.5rem;
                margin: 1.5rem 0;
                background: rgba(0,0,0,0.03);
                font-style: italic;
                font-family: ${FONT};
              }
              .brutalist-prose img {
                border: 3px solid #111;
                box-shadow: 4px 4px 0 #111;
                margin: 1.5rem 0;
              }
              .brutalist-prose a {
                background: ${GRADIENT};
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
                text-decoration: underline;
                text-decoration-color: rgb(124,58,237);
              }
              .brutalist-prose h2:first-child {
                margin-top: 0;
              }
            `}</style>
            <div
              className="brutalist-prose"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Footer nav */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/blog"
              className="flex flex-1 items-center justify-center gap-2 border-3 border-black bg-white px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-black transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ fontFamily: FONT, fontWeight: 900, boxShadow: '4px 4px 0 #111' }}
            >
              <ArrowLeft className="h-4 w-4" />
              All Articles
            </Link>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 border-3 border-black px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-white transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
              style={{ fontFamily: FONT, fontWeight: 900, background: GRADIENT, boxShadow: '4px 4px 0 #111' }}
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        {/* Read Next section */}
        {otherPosts.length > 0 && (
          <section className="border-t-3 border-black px-6 py-16 md:py-20">
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-10 flex items-center gap-4">
                <h2
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: 'rgba(0,0,0,0.3)' }}
                >
                  Read Next
                </h2>
                <div className="h-[3px] flex-1 bg-black/10" />
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                {otherPosts.map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="group flex flex-col overflow-hidden bg-white shadow-[8px_8px_0_#111] transition-[transform,box-shadow] duration-300 hover:shadow-[12px_12px_0_#111] [transform:rotate(var(--card-rotate))] hover:[transform:rotate(0deg)_translate(-4px,-4px)]"
                    style={
                      {
                        border: '4px solid #111',
                        '--card-rotate': i === 0 ? '-0.8deg' : '0.6deg',
                      } as CSSProperties & { ['--card-rotate']?: string }
                    }
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {p.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.coverImage}
                          alt={p.title}
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
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="mb-4 line-clamp-2 flex-1 text-sm font-semibold leading-relaxed" style={{ color: 'rgba(0,0,0,0.45)' }}>
                          {p.excerpt}
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
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
