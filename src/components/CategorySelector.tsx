"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

export default function CategorySelector() {
  const variants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (delay: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  // Shared viewport config to trigger only once
  const viewportConfig = { once: true, amount: 0.4 };

  return (
    <section className="w-full h-[80vh] flex flex-col md:flex-row gap-4 overflow-hidden py-16 px-6">
      {/* LEFT - PROFILÉ MURAL */}
      <div className="relative h-full w-full md:w-1/2 overflow-hidden group">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700  " style={{ backgroundImage: "url('/c2.webp')" }} />
        <div className="absolute inset-0  bg-black/80" />

        <motion.div 
          className="relative z-10 h-full flex flex-col justify-center px-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <motion.h2
            className="text-white text-4xl md:text-5xl font-bold tracking-tight"
            variants={variants}
            custom={0}
          >
            PROFILE MURAL DÉCORATIF
          </motion.h2>

          <motion.p
            className="mt-6 max-w-md text-white/90 text-xl font-bold leading-[1.8] tracking-wide"
            variants={variants}
            custom={0.2}
          >
            Des solutions raffinées pour créer des lignes architecturales 
            élégantes et structurer vos espaces avec une finition parfaite.
          </motion.p>

          <motion.div variants={variants} custom={0.4}>
            <Link href="/boutique/categorie/effet-bois-d-interieur" className="inline-block">
              <button className="mt-8 px-8 py-3 border border-white/70 text-white text-sm font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-white hover:text-black hover:font-bold cursor-pointer">
                Explorer
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* RIGHT - PANNEAU MURAL */}
      <div className="relative h-full w-full md:w-1/2 overflow-hidden group">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700  " style={{ backgroundImage: "url('/c1.webp')" }} />
        <div className="absolute inset-0  bg-black/75" />

        <motion.div 
          className="relative z-10 h-full flex flex-col justify-center px-12"
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <motion.h2
            className="text-white text-4xl md:text-5xl font-bold tracking-tight"
            variants={variants}
            custom={0}
          >
            PANNEAU MURAL EN PVC
          </motion.h2>

          <motion.p
            className="mt-6 max-w-md text-white/90 text-xl font-bold leading-[1.8] tracking-wide"
            variants={variants}
            custom={0.2}
          >
            Des revêtements modernes et durables pour transformer vos murs 
            avec style tout en garantissant une installation simple et rapide.
          </motion.p>

          <motion.div variants={variants} custom={0.4}>
            <Link href="/boutique/categorie/effet-marbre" className="inline-block">
              <button className="mt-8 px-8 py-3 border border-white/70 text-white text-sm font-bold uppercase tracking-[0.2em] transition-all duration-500 hover:bg-white hover:text-black hover:font-bold cursor-pointer">
                Explorer
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
