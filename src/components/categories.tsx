"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { id: 1, name: "Lustres Modernes", image: "/modern-minimalist-chandelier.jpg" },
  { id: 2, name: "Lustres Classiques", image: "/classic-ornate-chandelier.jpg" },
  { id: 3, name: "Suspensions Design", image: "/designer-pendant-lights.jpg" },
  { id: 4, name: "Decoration Designer", image: "/luxury-home-decor-pieces.jpg" },
  { id: 5, name: "Appliques Murales", image: "/modern-minimalist-chandelier.jpg" },
  { id: 6, name: "Lampadaires et Lampes", image: "/designer-pendant-lights.jpg" },
  { id: 7, name: "Lampadaires et Lampes", image: "/designer-pendant-lights.jpg" },
  { id: 8, name: "Lampadaires et Lampes", image: "/designer-pendant-lights.jpg" },
  { id: 9, name: "Lampadaires et Lampes", image: "/designer-pendant-lights.jpg" },
];

export default function Categories() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const animate = () => {
      const cards = sectionRef.current?.querySelectorAll(".cat-card");
      if (!cards?.length) return;

      gsap.killTweensOf(cards);
      gsap.set(cards, { opacity: 0, y: 30, scale: 0.96 });

      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.12,
        overwrite: "auto",
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 90%",
      onEnter: animate,
    });

    return () => trigger.kill();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background px-40 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center text-balance font-serif text-4xl font-bold text-foreground md:text-5xl">
          Categories
        </h2>
        <p className="mb-8 text-center text-muted-foreground">
          Explorez nos differentes categories et trouvez rapidement les produits qui correspondent a
          vos besoins et a votre style.
        </p>

        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="cat-card group relative aspect-square w-full cursor-pointer overflow-hidden rounded-md"
            >
              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover grayscale transition duration-500 group-hover:grayscale-0"
                loading="lazy"
              />

              <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-4">
                <h3 className="text-center font-serif text-3xl font-bold text-white">{category.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
