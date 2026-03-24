"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const title = sectionRef.current?.querySelector(".about-title");
    const text = sectionRef.current?.querySelector(".about-text");
    const btn = sectionRef.current?.querySelector(".about-btn");

    if (!title || !text || !btn) return;

    gsap.set([title, text, btn], { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
    });

    tl.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out",
    })
      .to(
        text,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: "power2.out",
        },
        "-=0.25"
      )
      .to(
        btn,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.25"
      );

    return () => tl.scrollTrigger?.kill();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background px-4 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="relative h-[320px] overflow-hidden rounded-2xl shadow-sm lg:h-[420px]">
          <Image
            src="/aboutimg.webp"
            alt="A propos d UPDATE DESIGN"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            loading="lazy"
          />
        </div>

        <div className="space-y-6 py-4 lg:pr-6">
          <h2 className="about-title mb-2 text-balance font-serif text-4xl font-bold text-foreground md:text-5xl">
            A propos d UPDATE DESIGN
          </h2>

          <p className="about-text mb-4 font-sans text-lg leading-relaxed text-muted-foreground">
            UPDATE DESIGN selectionne des luminaires et pieces de decoration haut de gamme,
            penses pour sublimer chaque interieur. Nous mettons l accent sur des materiaux
            durables, des finitions impeccables et un design elegant pour vous offrir des produits
            uniques, fiables et faits pour durer.
          </p>

          <div className="about-btn">
            <button className="inline-block cursor-pointer rounded-md bg-accent px-6 py-3 font-medium text-white transition-opacity hover:opacity-80">
              En savoir plus
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
