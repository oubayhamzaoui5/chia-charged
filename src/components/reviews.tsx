import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    name: "Amira Ben Youssef",
    text: "Le lustre a complètement transformé ma salle à manger. Ce n’est pas simplement un éclairage — c’est une pièce maîtresse. La qualité est exceptionnelle.",
    rating: 5,
  },
  {
    id: 2,
    name: "Ahmed Trabelsi",
    text: "Un service client impeccable et une livraison soignée. Chaque détail était parfaitement pris en charge. Je commanderai à nouveau sans hésiter.",
    rating: 5,
  },
  {
    id: 3,
    name: "Ons Gharbi",
    text: "Des pièces qui valent vraiment l’investissement. Le savoir-faire est visible dans chaque détail. Je recommande fortement.",
    rating: 5,
  },
];

export default function Reviews() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".review-card");

      // initial state
      gsap.set(cards, { opacity: 0, y: 40, scale: 0.95 });

      // reveal left -> right with stagger
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.2, // left first, then next...
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          end: "top 35%",
          scrub: false,      // plays once as you reach it
          toggleActions: "play none none reverse",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-16 text-balance">
          Avis de Nos Clients
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="review-card p-8 border border-border rounded-lg bg-white"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-accent text-lg">
                    ★
                  </span>
                ))}
              </div>

              <p className="font-sans text-muted-foreground mb-6 italic">
                "{testimonial.text}"
              </p>

              <p className="font-serif font-semibold text-foreground">
                {testimonial.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
