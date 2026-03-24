"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

type Post = {
  id: string
  slug: string
  title: string
  excerpt?: string
  coverImage?: string
  created?: string
}

const rotations = ["-1deg", "0.5deg", "-0.7deg"]

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.34, 1.56, 0.64, 1] },
  }),
}

export default function LandingBlog({ posts }: { posts: Post[] }) {
  const preview = posts.slice(0, 3)
  if (preview.length === 0) return null

  return (
    <section
      className="border-t-3 border-black px-6 py-20 md:py-28"
      style={{
        backgroundColor: "#f5efe4",
        backgroundImage: "url('/texture.webp')",
        backgroundSize: "280px 280px",
      }}
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <h2
            className="text-[2.8rem] font-black uppercase leading-[0.88] tracking-tighter md:text-[4rem] lg:text-[5rem]"
            style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em", color: "#111" }}
          >
            Fuel Your{" "}
            <span
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Knowledge.
            </span>
          </h2>
          <p
            className="mt-3 text-sm font-black uppercase tracking-[0.15em]"
            style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
          >
            Tips, science & stories behind every bite.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((post, i) => (
            <motion.div
              key={post.id}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="landing-blog-card group flex flex-col overflow-hidden"
                style={{
                  background: "white",
                  border: "4px solid #111",
                  boxShadow: "8px 8px 0 #111",
                  transform: `rotate(${rotations[i % rotations.length]})`,
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "12px 12px 0 #111"
                  ;(e.currentTarget as HTMLElement).style.transform = "rotate(0deg) translate(-4px, -4px)"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.boxShadow = "8px 8px 0 #111"
                  ;(e.currentTarget as HTMLElement).style.transform = `rotate(${rotations[i % rotations.length]})`
                }}
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
                    style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                  >
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mb-4 line-clamp-2 flex-1 text-sm font-semibold leading-relaxed" style={{ color: "rgba(0,0,0,0.45)" }}>
                      {post.excerpt}
                    </p>
                  )}
                  <span
                    className="mt-auto inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      background: GRADIENT,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Read Article
                    <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" style={{ color: "rgb(124,58,237)" }} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {posts.length > 3 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-12 flex justify-center"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-sm border-3 border-black bg-white px-7 py-3 text-sm font-black uppercase tracking-[0.12em] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#111]"
              style={{ fontFamily: FONT, fontWeight: 900, color: "#111", boxShadow: "4px 4px 0 #111" }}
            >
              View All Posts
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
