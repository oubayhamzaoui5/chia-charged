'use client'

import Link from 'next/link'
import Image, { type StaticImageData } from 'next/image'

export type HomeCategoryItem = {
  name: string
  image: string | StaticImageData
  href: string
}

type HomeCategoryCardProps = {
  category: HomeCategoryItem
  mobile?: boolean
}

export default function HomeCategoryCard({ category, mobile = false }: HomeCategoryCardProps) {
  return (
    <Link className="group relative block overflow-hidden rounded-xl aspect-[16/9]" href={category.href}>
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes={mobile ? '85vw' : '(min-width: 768px) 50vw, 100vw'}
        className={
          mobile
            ? 'object-cover'
            : 'absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105'
        }
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
      <div className={mobile ? 'absolute bottom-4 left-4' : 'absolute bottom-6 left-6'}>
        <h3
          className={
            mobile
              ? 'text-sm font-bold text-white'
              : 'text-xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-0.5'
          }
        >
          {category.name}
        </h3>
        {!mobile && (
          <span className="inline-block translate-y-1 text-sm font-semibold text-[#c19a2f] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:translate-x-1">
            Explorer -&gt;
          </span>
        )}
      </div>
    </Link>
  )
}
