type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  id?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  id,
}: SectionHeaderProps) {
  return (
    <header className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.24em] text-stone-600">{eyebrow}</p>
      ) : null}
      <h2 id={id} className="mt-3 font-serif text-3xl tracking-tight text-stone-950 sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-sm leading-relaxed text-stone-700 sm:text-base">{description}</p> : null}
    </header>
  )
}
