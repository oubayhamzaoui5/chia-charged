export default function HomeMapSection() {
  return (
    <section className="h-[210px] w-full bg-white md:h-[420px]">
      <iframe
        allowFullScreen
        className="h-full w-full [filter:contrast(1.2)_opacity(0.85)]"
        loading="lazy"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.142426065!2d2.299616315674312!3d48.8745919792892!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66fc4f8f4133b%3A0x6331a9864e962139!2sAv.%20des%20Champs-%C3%89lys%C3%A9es%2C%20Paris!5e0!3m2!1sfr!2sfr!4v1625000000000!5m2!1sfr!2sfr"
        title="Localisation Update Design"
      />
    </section>
  )
}
