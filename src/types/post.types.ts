export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: string
  content: string
  relatedProducts: string[]
  published: boolean
  created: string
  updated: string
}

export type BlogPostPreview = Omit<BlogPost, 'content'>

export type PostUpsertInput = {
  title?: string
  slug?: string
  excerpt?: string
  coverImage?: string | File
  content?: string
  relatedProducts?: string[]
  published?: boolean
}
