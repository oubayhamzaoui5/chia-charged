'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import DOMPurify from 'isomorphic-dompurify'

import { assertPocketBaseId } from '@/lib/admin/validation'
import { createPost, deletePost, updatePost } from '@/lib/services/posts.service'
import type { PostUpsertInput } from '@/types/post.types'
import { slugify } from '@/utils/slug'

function parsePublished(value: FormDataEntryValue | null): boolean {
  if (typeof value !== 'string') return false
  return value === 'on' || value === 'true' || value === '1'
}

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script'],
    ADD_ATTR: ['style', 'target', 'rel'],
  })
}

function toInput(formData: FormData): PostUpsertInput {
  const title = String(formData.get('title') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim()
  const coverImageEntry = formData.get('coverImage')
  const coverImage =
    coverImageEntry instanceof File && coverImageEntry.size > 0
      ? coverImageEntry
      : undefined
  const relatedProducts = formData
    .getAll('relatedProducts')
    .map((value) => String(value).trim())
    .filter(Boolean)

  return {
    title,
    slug: rawSlug || slugify(title),
    excerpt: String(formData.get('excerpt') ?? ''),
    coverImage,
    content: sanitizeHtml(String(formData.get('content') ?? '')),
    relatedProducts,
    published: parsePublished(formData.get('published')),
  }
}

function revalidateBlogPaths() {
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  revalidatePath('/')
}

export async function createPostAction(formData: FormData) {
  await createPost(toInput(formData))
  revalidateBlogPaths()
  redirect('/admin/blog')
}

export async function updatePostAction(id: string, formData: FormData) {
  assertPocketBaseId(id, 'post id')
  await updatePost(id, toInput(formData))
  revalidateBlogPaths()
  redirect('/admin/blog')
}

export async function togglePostPublishedAction(id: string, nextPublished: boolean) {
  assertPocketBaseId(id, 'post id')
  await updatePost(id, { published: nextPublished })
  revalidateBlogPaths()
}

export async function deletePostAction(id: string) {
  assertPocketBaseId(id, 'post id')
  await deletePost(id)
  revalidateBlogPaths()
}
