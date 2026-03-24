import type { ComponentPropsWithoutRef } from 'react'

import type { MDXComponents } from 'mdx/types'

function Anchor(props: ComponentPropsWithoutRef<'a'>) {
  const href = props.href ?? ''
  const external = /^https?:\/\//i.test(href)

  return (
    <a
      {...props}
      className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
      rel={external ? 'noreferrer noopener' : props.rel}
      target={external ? '_blank' : props.target}
    />
  )
}

function ImageTag(props: ComponentPropsWithoutRef<'img'>) {
  return (
    <img
      {...props}
      alt={props.alt ?? ''}
      loading="lazy"
      className="my-6 h-auto w-full rounded-xl border border-foreground/10 object-cover"
    />
  )
}

export const mdxComponents: MDXComponents = {
  h1: (props) => <h1 className="mb-4 mt-8 text-4xl font-bold tracking-tight" {...props} />,
  h2: (props) => <h2 className="mb-3 mt-8 text-2xl font-semibold tracking-tight" {...props} />,
  p: (props) => <p className="mb-4 leading-7 text-foreground/90" {...props} />,
  ul: (props) => <ul className="mb-4 list-disc space-y-2 pl-6" {...props} />,
  ol: (props) => <ol className="mb-4 list-decimal space-y-2 pl-6" {...props} />,
  a: Anchor,
  img: ImageTag,
}

