"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const baseImages = [
  "/aboutimg.webp",
  "/aboutimg.webp",
  "/aboutimg.webp",
  "/aboutimg.webp",
];

const products = [
  {
    id: 1,
    name: "Lustre Brillance Cristal",
    sku: "Reference: LUS-CRYS-001",
    description:
      "Un lustre etincelant en cristal taille, concu pour sublimer les grands espaces avec une elegance intemporelle.",
    price: "$2,450",
    image: baseImages[0],
  },
  {
    id: 2,
    name: "Lampe Arc Minimaliste",
    sku: "Reference: LMP-ARC-014",
    description:
      "Une silhouette moderne et epuree, parfaite pour un salon contemporain. Lumiere douce et chaleureuse.",
    price: "$890",
    image: baseImages[1],
  },
  {
    id: 3,
    name: "Suspension Couronne Doree",
    sku: "Reference: SUS-GOLD-210",
    description:
      "Suspension doree au design raffine, ideale pour apporter une touche luxueuse a votre interieur.",
    price: "$1,200",
    image: baseImages[2],
  },
  {
    id: 4,
    name: "Lampe de Sol Sculpturale",
    sku: "Reference: SOL-SCULPT-332",
    description:
      "Une piece statement au style artistique, combinant lignes audacieuses et finitions premium.",
    price: "$1,650",
    image: baseImages[3],
  },
  {
    id: 5,
    name: "Applique Marbre Serein",
    sku: "Reference: APP-MARB-118",
    description:
      "Applique murale en marbre clair, diffuse une lumiere douce pour une ambiance raffinee.",
    price: "$540",
    image: baseImages[0],
  },
  {
    id: 6,
    name: "Suspension Laiton Vintage",
    sku: "Reference: SUS-BRAS-502",
    description:
      "Un charme retro en laiton brosse, ideale au-dessus d une table a manger.",
    price: "$980",
    image: baseImages[1],
  },
  {
    id: 7,
    name: "Lampe Ceramique Organique",
    sku: "Reference: LMP-CERA-077",
    description:
      "Base en ceramique texturee aux formes naturelles, esprit artisanal chic.",
    price: "$420",
    image: baseImages[2],
  },
  {
    id: 8,
    name: "Plafonnier Opalin",
    sku: "Reference: PLA-OPAL-230",
    description:
      "Verre opalin satine pour une diffusion homogene, minimalisme elegant.",
    price: "$760",
    image: baseImages[3],
  },
  {
    id: 9,
    name: "Lampe de Sol Noir Mat",
    sku: "Reference: SOL-BLKM-913",
    description: "Finition noir mat et lignes fines, parfaite pour un coin lecture.",
    price: "$690",
    image: baseImages[0],
  },
  {
    id: 10,
    name: "Suspension Nuage",
    sku: "Reference: SUS-CLOUD-404",
    description: "Volume aerien et lumiere enveloppante pour un interieur poetique.",
    price: "$1,110",
    image: baseImages[1],
  },
  {
    id: 11,
    name: "Lampe Doree Art Deco",
    sku: "Reference: LMP-AD-301",
    description: "Inspiree des lignes Art Deco, finitions dorees et verre strie.",
    price: "$1,350",
    image: baseImages[2],
  },
  {
    id: 12,
    name: "Lustre Moderniste Lineaire",
    sku: "Reference: LUS-LINE-888",
    description: "Structure lineaire contemporaine, ideale pour ilot ou grande table.",
    price: "$2,100",
    image: baseImages[3],
  },
];

export default function NewArrive() {
  const [page, setPage] = useState(0);
  const [perView, setPerView] = useState(4);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const AUTO_MS = 3500;

  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const hasRevealedRef = useRef(false);

  useEffect(() => {
    const calcPerView = () => {
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1024) return 2;
      return 4;
    };

    const update = () => setPerView(calcPerView());
    update();

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = useMemo(() => Math.ceil(products.length / perView), [perView]);

  const clearAuto = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const startAuto = () => {
    clearAuto();
    intervalRef.current = setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, AUTO_MS);
  };

  useEffect(() => {
    startAuto();
    return clearAuto;
  }, [pageCount]);

  const goTo = (i: number) => {
    setPage(i);
    startAuto();
  };

  const animateCurrentPage = () => {
    if (!trackRef.current) return;

    const panel = trackRef.current.querySelector(`[data-panel="${page}"]`);
    if (!panel) return;

    const cards = panel.querySelectorAll(".na-card");

    gsap.killTweensOf(cards);
    gsap.set(cards, { opacity: 0, y: 30, scale: 0.96 });

    gsap.to(cards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.12,
      overwrite: "auto",
    });
  };

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top 75%",
      onEnter: () => {
        if (hasRevealedRef.current) return;
        hasRevealedRef.current = true;
        animateCurrentPage();
      },
      onEnterBack: () => {
        if (hasRevealedRef.current) return;
        hasRevealedRef.current = true;
        animateCurrentPage();
      },
    });

    return () => trigger.kill();
  }, [pageCount]);

  return (
    <section ref={sectionRef} className="bg-white px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-2 text-center text-balance font-serif text-4xl font-bold text-foreground md:text-5xl">
          Nouveautes
        </h2>
        <p className="mb-8 text-center text-muted-foreground">
          Decouvrez nos dernieres arrivees, selectionnees pour leur elegance et leur savoir-faire
        </p>

        <div className="relative">
          <div className="overflow-x-hidden overflow-y-visible pb-6">
            <div
              ref={trackRef}
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${page * 100}%)` }}
            >
              {Array.from({ length: pageCount }).map((_, i) => {
                const start = i * perView;
                const slice = products.slice(start, start + perView);

                return (
                  <div
                    key={i}
                    data-panel={i}
                    className="grid min-w-full grid-cols-1 items-start gap-8 px-1 md:grid-cols-2 lg:grid-cols-4"
                  >
                    {slice.map((product) => (
                      <div key={product.id} className="na-card group flex flex-col">
                        <div className="relative mb-4 h-64 overflow-hidden rounded-lg">
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>

                        <h3 className="mb-1 font-serif text-lg font-semibold text-foreground">{product.name}</h3>

                        <p className="mb-2 text-sm text-muted-foreground">{product.sku}</p>

                        <p className="mb-3 line-clamp-2 text-sm text-foreground/80">{product.description}</p>

                        <p className="mb-4 font-medium text-accent">{product.price}</p>

                        <button className="mt-auto w-full rounded border border-foreground py-2 text-foreground transition-colors hover:bg-foreground hover:text-background">
                          Voir
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Aller a la page ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === page ? "w-8 bg-foreground" : "w-2.5 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
