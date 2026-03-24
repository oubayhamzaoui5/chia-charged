"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

const FONT = "'Arial Black', 'Impact', 'Haettenschweiler', sans-serif"
const GRADIENT = "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 50%, rgb(232,68,106) 100%)"

export default function LandingContact() {
  const [purpose, setPurpose] = useState("general")

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-y-3 border-black py-20 md:py-28"
      style={{ background: GRADIENT }}
    >
      {/* Decorative watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[5%] -bottom-[10%] tracking-wider select-none"
        style={{
          fontSize: "32rem",
          lineHeight: 0.8,
          fontFamily: FONT,
          fontWeight: 900,
          color: "rgba(255,255,255,0.2)",
        }}
      >
        @@
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT: Text + icons */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <h2
              className="mb-6 text-[3rem] font-black uppercase leading-[0.88] tracking-tighter text-white md:text-[4.2rem] lg:text-[5.2rem]"
              style={{ fontFamily: FONT, fontWeight: 900, letterSpacing: "-0.03em" }}
            >
              Get In<br />
              <span style={{ color: "#ffffff" }}>Touch.</span>
            </h2>
            <p
              className="mb-10 max-w-md text-base font-bold leading-relaxed text-white md:text-lg"
            >
              Have a question about your order, our products, or just want to say hi? Drop us a message and we&apos;ll get back to you fast.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              {/* Instagram */}
              <button
                className="shimmer-btn relative isolate flex cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-sm border-3 border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_rgba(255,255,255,1)]"
                style={{ fontFamily: FONT, fontWeight: 900, background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 100%)", color: "white", boxShadow: "3px 3px 0 rgba(255,255,255,1)" }}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </button>

              {/* Facebook */}
              <button
                className="shimmer-btn relative isolate flex cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-sm border-3 border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_rgba(255,255,255,1)]"
                style={{ fontFamily: FONT, fontWeight: 900, background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 100%)", color: "white", boxShadow: "3px 3px 0 rgba(255,255,255,1)" }}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>

              {/* TikTok */}
              <button
                className="shimmer-btn relative isolate flex cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-sm border-3 border-white px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition-all duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_rgba(255,255,255,1)] hover:brightness-105 active:translate-x-0 active:translate-y-0 active:shadow-[1px_1px_0px_rgba(255,255,255,1)]"
                style={{ fontFamily: FONT, fontWeight: 900, background: "linear-gradient(135deg, rgb(124,58,237) 0%, rgb(185,58,210) 100%)", color: "white", boxShadow: "3px 3px 0 rgba(255,255,255,1)" }}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                </svg>
                TikTok
              </button>
            </div>
          </motion.div>

          {/* RIGHT: Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="p-8"
            style={{
              background: "white",
              border: "4px solid #111",
              borderRadius: "14px",
              boxShadow: "8px 8px 0 rgba(0,0,0,0.5)",
            }}
          >
            <h3
              className="mb-8 text-xl font-black uppercase tracking-wide"
              style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
            >
              Send a Message
            </h3>

            <form className="grid grid-cols-1 gap-5">
              <label>
                <span
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  Full Name
                </span>
                <input
                  className="w-full px-4 py-3 text-sm font-bold outline-none transition-all duration-200"
                  placeholder="Your name"
                  type="text"
                  style={{ border: "3px solid #111", borderRadius: "8px", background: "rgba(245,239,228,0.5)" }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = "4px 4px 0 #111"; e.currentTarget.style.transform = "translate(-2px, -2px)" }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                />
              </label>

              <label>
                <span
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  Email
                </span>
                <input
                  className="w-full px-4 py-3 text-sm font-bold outline-none transition-all duration-200"
                  placeholder="your@email.com"
                  type="email"
                  style={{ border: "3px solid #111", borderRadius: "8px", background: "rgba(245,239,228,0.5)" }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = "4px 4px 0 #111"; e.currentTarget.style.transform = "translate(-2px, -2px)" }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                />
              </label>

              <label>
                <span
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  Purpose
                </span>
                <select
                  className="w-full px-4 py-3 text-sm font-bold outline-none transition-all duration-200"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  style={{ border: "3px solid #111", borderRadius: "8px", background: "rgba(245,239,228,0.5)" }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = "4px 4px 0 #111"; e.currentTarget.style.transform = "translate(-2px, -2px)" }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                >
                  <option value="general">General question</option>
                  <option value="order">Order support</option>
                  <option value="product">Product info</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <AnimatePresence initial={false}>
                {purpose === "other" && (
                  <motion.div
                    key="purpose-other"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <label className="block pt-1">
                      <span
                        className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em]"
                        style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                      >
                        Tell us more
                      </span>
                      <input
                        className="w-full px-4 py-3 text-sm font-bold outline-none transition-all duration-200"
                        placeholder="What is this about?"
                        type="text"
                        style={{ border: "3px solid #111", borderRadius: "8px", background: "rgba(245,239,228,0.5)" }}
                        onFocus={(e) => { e.currentTarget.style.boxShadow = "4px 4px 0 #111"; e.currentTarget.style.transform = "translate(-2px, -2px)" }}
                        onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              <label>
                <span
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.15em]"
                  style={{ fontFamily: FONT, fontWeight: 900, color: "#111" }}
                >
                  Your Message
                </span>
                <textarea
                  className="w-full px-4 py-3 text-sm font-bold outline-none transition-all duration-200"
                  placeholder="How can we help?"
                  rows={5}
                  style={{ border: "3px solid #111", borderRadius: "8px", background: "rgba(245,239,228,0.5)", resize: "vertical" }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = "4px 4px 0 #111"; e.currentTarget.style.transform = "translate(-2px, -2px)" }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none" }}
                />
              </label>

              <button
                className="shimmer-btn relative isolate mt-2 inline-flex h-14 w-full items-center justify-center overflow-hidden text-sm font-black uppercase tracking-[0.15em] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#111] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_#111]"
                type="submit"
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  background: GRADIENT,
                  color: "white",
                  border: "3px solid #111",
                  borderRadius: "8px",
                  boxShadow: "4px 4px 0 #111",
                  cursor: "pointer",
                }}
              >
                Send Message &#8594;
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
