"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Facebook, Instagram, Mail, MapPin, Phone, Info  } from "lucide-react";

const contactItems = [
  {
    type: "address",
    title: "Showroom Tunis",
    text: "Avenue Habib Bourguiba, Immeuble Le Prestige, Tunis 1000",
    Icon: MapPin,
  },
  {
    type: "address",
    title: "Boutique Sousse",
    text: "Route Touristique, Résidence Jade, Sousse 4051",
    Icon: MapPin,
  },
  {
    type: "phone",
    title: "Téléphone 1",
    text: "+216 55 500 011",
    href: "tel:+21655500011",
    Icon: Phone,
  },
  {
    type: "phone",
    title: "Téléphone 2",
    text: "+216 55 500 022",
    href: "tel:+21655500022",
    Icon: Phone,
  },
  {
    type: "email",
    title: "Email",
    text: "contact@updatedesign.tn",
    href: "mailto:contact@updatedesign.tn",
    Icon: Mail,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Contact form submitted:", form);
  };

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-balance">
            Contactez-nous
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Une question, un projet, ou besoin de conseil ? Notre équipe est à
            votre écoute.
          </p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/50 p-6 md:p-8 h-full flex flex-col">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Mail className="w-6 h-6 text-foreground" />
              Envoyez-nous un message
            </h2>

            <form
              onSubmit={onSubmit}
              className="space-y-5 flex-grow flex flex-col"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom complet
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    type="text"
                    placeholder="Votre nom"
                    className="w-full rounded-lg border border-black/40 bg-white px-4 py-3 text-foreground outline-none focus:border-foreground/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    type="email"
                    placeholder="vous@email.com"
                    className="w-full rounded-lg border border-black/40 bg-white px-4 py-3 text-foreground outline-none focus:border-foreground/40 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sujet
                </label>
                <input
                  name="subject"
                  value={form.subject}
                  onChange={onChange}
                  required
                  type="text"
                  placeholder="Commande, projet, conseil..."
                  className="w-full rounded-lg border border-black/40 bg-white px-4 py-3 text-foreground outline-none focus:border-foreground/40 transition"
                />
              </div>

              <div className="flex-grow">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={onChange}
                  required
                  rows={6}
                  placeholder="Décrivez votre besoin..."
                  className="w-full rounded-lg border border-black/40 bg-white px-4 py-3 text-foreground outline-none focus:border-foreground/40 transition resize-none h-full"
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full md:w-auto px-6 py-3 bg-accent text-white font-medium rounded-md hover:opacity-80 cursor-pointer transition-opacity mt-0"
              >
                Envoyer
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/40 p-6 md:p-8 h-full flex flex-col">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                            <Info className="w-6 h-6 text-foreground" />

              Informations de contact
            </h2>

            <div className="space-y-5 text-foreground/90 flex-grow">
              {contactItems.map((item, i) => {
                const Icon = item.Icon;
                const isEven = i % 2 === 0;

                // icon color rule (even=black, odd=accent)
                const iconColorClass = isEven ? "text-black" : "text-accent";
                const iconBgClass = isEven
                  ? "bg-black/5 border-black/10"
                  : "bg-accent/10 border-accent/20";

                return (
                  <div key={i} className="flex gap-3 items-start">
                    {/* Icon inside a small rounded box */}
                    <div
                      className={`w-9 h-9 rounded-full border grid place-items-center shrink-0 ${iconBgClass}`}
                      aria-hidden="true"
                    >
                      <Icon className={`w-5 h-5 ${iconColorClass}`} />
                    </div>

                    <div>
                      <p className="font-medium">{item.title}</p>

                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm text-muted-foreground hover:text-foreground transition"
                        >
                          {item.text}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {item.text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Social icons inside the box */}
            <div className="pt-6 flex justify-start gap-4">
              <a
                href="https://facebook.com/updatedesign"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full border border-black/10 bg-white grid place-items-center hover:bg-accent hover:text-background transition"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>

              <a
                href="https://instagram.com/updatedesign"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full border border-black/10 bg-white grid place-items-center hover:bg-accent hover:text-background transition"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
