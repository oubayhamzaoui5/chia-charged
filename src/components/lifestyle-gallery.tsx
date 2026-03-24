import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const images = [
  { id: 1, src: "/aboutimg.webp", alt: "Modern interior with elegant chandelier" },
  { id: 2, src: "/aboutimg.webp", alt: "Dining room with crystal lighting" },
  { id: 3, src: "/aboutimg.webp", alt: "Contemporary space with pendant lighting" },
  { id: 4, src: "/aboutimg.webp", alt: "Bedroom with luxury wall lighting" },
  { id: 5, src: "/aboutimg.webp", alt: "Bedroom with luxury wall lighting" },
    { id: 6, src: "/aboutimg.webp", alt: "Bedroom with luxury wall lighting" },

];

export default function LifestyleGallery() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray(".gallery-item");

      // start hidden + scaled down
      gsap.set(items, { opacity: 0, y: 50, scale: 0.9 });

      // scroll-linked stagger reveal
      gsap.to(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: "none",
        stagger: 0.18,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top center",
          end: "center center", // finishes when section center hits viewport center
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-26 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((image, idx) => (
            <div
              key={image.id}
              className={`gallery-item overflow-hidden rounded-lg ${
                idx % 3 === 0 ? "md:col-span-2 h-96" : "h-80"
              }`}
            >
              <img
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
