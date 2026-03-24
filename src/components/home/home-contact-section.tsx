export default function HomeContactSection() {
  return (
    <section id="contact" className="bg-white py-8 lg:py-18">
      <div className="mx-auto max-w-7xl px-2">
        <div className="mb-12 lg:mb-14 text-center">
          <p className="mb-1 lg:mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#c19a2f]">Entrer en contact</p>
          <h2 className="mb-2 lg:mb-4 text-3xl lg:text-4xl font-bold text-slate-900">Contactez-nous</h2>
          <p className="mx-auto max-w-3xl text-slate-500">
            Besoin d un conseil personnalise pour votre eclairage ou une question sur une commande ? Notre equipe est disponible pour vous accompagner.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="space-y-8 rounded-2xl border-0 bg-white p-4 md:border md:border-slate-200 md:p-8">
            <h3 className="text-2xl font-bold text-slate-900">Informations de contact</h3>

            <div className="space-y-7">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#c19a2f]/10 p-3 text-[#c19a2f]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.657 16.657 13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    <path d="M15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-semibold">Notre Boutique</h4>
                  <p className="text-slate-600">123 Avenue du Design, 75008 Paris, France</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#c19a2f]/10 p-3 text-[#c19a2f]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498A1 1 0 0 1 21 16.72V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-semibold">Telephone</h4>
                  <p className="text-slate-600">+33 (0) 1 23 45 67 89</p>
                  <p className="mt-1 text-xs text-slate-400">Lun - Ven : 09h00 - 18h00</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-full bg-[#c19a2f]/10 p-3 text-[#c19a2f]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="m3 8 7.89 5.26a2 2 0 0 0 2.22 0L21 8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                    <path d="M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-semibold">Email</h4>
                  <p className="text-slate-600">contact@updatedesign.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-0 bg-white p-4 md:border md:border-slate-200 md:p-8">
            <h3 className="mb-6 text-2xl font-bold text-slate-900">Envoyez un message</h3>
            <form className="grid grid-cols-1 gap-5">
              <label className="text-sm font-medium text-slate-700">
                Nom complet
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#c19a2f]"
                  placeholder="Ahmed Gharbi"
                  type="text"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Email
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#c19a2f]"
                  placeholder="Ahmedgharbi@mail.com"
                  type="email"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Sujet
                <select className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#c19a2f]">
                  <option>Demande d information</option>
                  <option>Suivi de commande</option>
                  <option>Collaboration professionnelle</option>
                  <option>Service apres-vente</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Votre message
                <textarea
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#c19a2f]"
                  placeholder="Comment pouvons-nous vous aider ?"
                  rows={5}
                />
              </label>

              <button
                className="cursor-pointer rounded-lg bg-[#c19a2f] px-6 py-4 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90"
                type="submit"
              >
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
