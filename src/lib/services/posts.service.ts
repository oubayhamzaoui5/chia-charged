import 'server-only'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import DOMPurify from 'isomorphic-dompurify'
import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'
import { getPb } from '@/lib/pb'
import type { BlogPost, BlogPostPreview, PostUpsertInput } from '@/types/post.types'
import { slugify } from '@/utils/slug'

const POSTS_COLLECTION = 'posts'
const PRODUCTS_COLLECTION = 'products'
const VALID_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const BLOG_PUBLIC_PREFIX = '/blog-images/'
const LEGACY_BLOG_PUBLIC_PREFIX = '/blog/'
const BLOG_PUBLIC_DIR = path.join(process.cwd(), 'public', 'blog-images')
const LEGACY_BLOG_PUBLIC_DIR = path.join(process.cwd(), 'public', 'blog')
const IMG_SRC_REGEX = /<img\b[^>]*\bsrc=(['"])(.*?)\1[^>]*>/gi

function escapePbFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function toSafeText(value: unknown, max = 8000): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function toSafeCoverImage(value: unknown): string {
  const cleaned = toSafeText(value, 2048)
  if (!cleaned) return ''
  if (cleaned.startsWith('/')) return cleaned
  if (/^https?:\/\//i.test(cleaned)) return cleaned
  return ''
}

type PocketBaseLike = {
  files: {
    getURL: (record: Record<string, unknown>, filename: string) => string
    getUrl?: (record: Record<string, unknown>, filename: string) => string
  }
}

function normalizeRelationIds(value: unknown): string[] {
  if (!value) return []
  const arr = Array.isArray(value) ? value : [value]
  return arr
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (typeof item === 'object' && item && 'id' in item) return String((item as { id: unknown }).id ?? '').trim()
      return ''
    })
    .filter(Boolean)
}

function buildPbProductsFileUrl(productId: string, filename: string): string {
  const base =
    process.env.NEXT_PUBLIC_PB_URL ??
    process.env.POCKETBASE_URL ??
    'http://127.0.0.1:8090'
  return `${base}/api/files/products/${productId}/${encodeURIComponent(filename)}`
}

function extensionFromMime(mime: string): string {
  const normalized = mime.toLowerCase()
  if (normalized.includes('png')) return '.png'
  if (normalized.includes('webp')) return '.webp'
  if (normalized.includes('gif')) return '.gif'
  if (normalized.includes('svg')) return '.svg'
  return '.jpg'
}

function extractBlogPublicPath(value: unknown): string {
  if (typeof value !== 'string') return ''
  const cleaned = value.trim()
  if (!cleaned) return ''
  if (cleaned.startsWith(BLOG_PUBLIC_PREFIX) || cleaned.startsWith(LEGACY_BLOG_PUBLIC_PREFIX)) return cleaned

  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const url = new URL(cleaned)
      if (url.pathname.startsWith(BLOG_PUBLIC_PREFIX) || url.pathname.startsWith(LEGACY_BLOG_PUBLIC_PREFIX)) {
        return url.pathname
      }
    } catch {
      return ''
    }
  }

  return ''
}

function toAbsoluteBlogPath(publicPath: string): string | null {
  const relative = publicPath.replace(/^\/+/, '')
  const absolute = path.normalize(path.join(process.cwd(), 'public', relative))
  const allowedRoots = [
    path.normalize(`${BLOG_PUBLIC_DIR}${path.sep}`),
    path.normalize(`${LEGACY_BLOG_PUBLIC_DIR}${path.sep}`),
  ]
  if (!allowedRoots.some((root) => absolute.startsWith(root))) return null
  return absolute
}

async function deleteBlogImageByValue(value: unknown): Promise<void> {
  const publicPath = extractBlogPublicPath(value)
  if (!publicPath) return

  const absolute = toAbsoluteBlogPath(publicPath)
  if (!absolute) return

  try {
    await unlink(absolute)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== 'ENOENT') throw error
  }
}

async function saveDataUrlImage(dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\r\n]+)$/)
  if (!match) throw new Error('Invalid inline content image.')

  const mime = match[1]
  const base64 = match[2].replace(/\s/g, '')
  const extension = extensionFromMime(mime)
  const filename = `${Date.now()}-${randomUUID()}${extension}`
  const targetPath = path.join(BLOG_PUBLIC_DIR, filename)
  const buffer = Buffer.from(base64, 'base64')
  await mkdir(BLOG_PUBLIC_DIR, { recursive: true })
  await writeFile(targetPath, buffer)
  return `${BLOG_PUBLIC_PREFIX}${filename}`
}

function extractLocalBlogImagePathsFromHtml(html: string): Set<string> {
  const paths = new Set<string>()
  for (const match of html.matchAll(IMG_SRC_REGEX)) {
    const src = String(match[2] ?? '')
    const maybePath = extractBlogPublicPath(src)
    if (maybePath) paths.add(maybePath)
  }
  return paths
}

async function replaceInlineContentImages(html: string): Promise<{ html: string; savedPaths: string[] }> {
  const replacements = new Map<string, string>()
  const savedPaths: string[] = []

  for (const match of html.matchAll(IMG_SRC_REGEX)) {
    const src = String(match[2] ?? '')
    if (!src.startsWith('data:image/')) continue
    if (!replacements.has(src)) {
      const savedPath = await saveDataUrlImage(src)
      replacements.set(src, savedPath)
      savedPaths.push(savedPath)
    }
  }

  let nextHtml = html
  for (const [from, to] of replacements) {
    nextHtml = nextHtml.split(from).join(to)
  }

  return { html: nextHtml, savedPaths }
}

async function deleteBlogImages(paths: Iterable<string>): Promise<void> {
  for (const imgPath of paths) {
    await deleteBlogImageByValue(imgPath)
  }
}

function sanitizeHtmlContent(value: unknown): string {
  const raw = toSafeText(value, 2_000_000).replace(/\r\n/g, '\n')
  if (!raw) return ''
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script'],
    ADD_ATTR: ['style', 'target', 'rel'],
  })
}

function toRawHtmlContent(value: unknown): string {
  return toSafeText(value, 2_000_000).replace(/\r\n/g, '\n')
}

function normalizeSlug(slug: unknown, fallbackTitle: unknown): string {
  const candidate = toSafeText(slug, 300) || toSafeText(fallbackTitle, 300)
  const normalized = slugify(candidate)
  if (!normalized || !VALID_SLUG_REGEX.test(normalized)) {
    throw new Error('Invalid post slug.')
  }
  return normalized
}

function resolveCoverImageUrl(pb: PocketBaseLike, record: Record<string, unknown>): string {
  const collectionId = toSafeText(record.collectionId, 120)
  const recordId = toSafeText(record.id, 120)
  const toProxyUrl = (filename: string): string => {
    const safeFile = filename.trim()
    if (!safeFile || !collectionId || !recordId) return ''
    return `/api/pb-files/${encodeURIComponent(collectionId)}/${encodeURIComponent(recordId)}/${encodeURIComponent(safeFile)}`
  }

  const rawCover = record.coverImage
  if (typeof rawCover === 'string' && rawCover.trim()) {
    const safe = toSafeCoverImage(rawCover)
    if (safe) return safe
    const proxyUrl = toProxyUrl(rawCover)
    if (proxyUrl) return proxyUrl
    return pb.files.getURL(record, rawCover.trim())
  }

  if (Array.isArray(rawCover)) {
    const first = rawCover.find((value) => typeof value === 'string' && value.trim())
    if (typeof first === 'string') {
      const proxyUrl = toProxyUrl(first)
      if (proxyUrl) return proxyUrl
      return pb.files.getURL(record, first.trim())
    }
  }

  return ''
}

function mapPost(pb: PocketBaseLike, record: Record<string, unknown>): BlogPost {
  return {
    id: String(record.id ?? ''),
    title: toSafeText(record.title, 300),
    slug: toSafeText(record.slug, 300),
    excerpt: toSafeText(record.excerpt, 2000),
    coverImage: resolveCoverImageUrl(pb, record),
    content: sanitizeHtmlContent(record.content),
    relatedProducts: normalizeRelationIds(record.relatedProducts),
    published: Boolean(record.published),
    created: toSafeText(record.created, 64),
    updated: toSafeText(record.updated, 64),
  }
}

function normalizeInput(input: PostUpsertInput, mode: 'create' | 'update') {
  const title = toSafeText(input.title, 300)
  if (mode === 'create' && !title) {
    throw new Error('Post title is required.')
  }

  const payload: Record<string, unknown> = {}

  if (title) payload.title = title
  if (mode === 'create' || input.slug != null || title) {
    payload.slug = normalizeSlug(input.slug, input.title)
  }
  if (mode === 'create' || input.excerpt != null) {
    payload.excerpt = toSafeText(input.excerpt, 2000)
  }
  if (input.coverImage instanceof File && input.coverImage.size > 0) {
    payload.coverImage = input.coverImage
  } else if (typeof input.coverImage === 'string') {
    payload.coverImage = toSafeCoverImage(input.coverImage)
  }
  if (mode === 'create' || input.content != null) {
    payload.content = toRawHtmlContent(input.content)
  }
  if (mode === 'create' || input.relatedProducts != null) {
    payload.relatedProducts = Array.from(
      new Set((input.relatedProducts ?? []).map((id) => String(id).trim()).filter(Boolean))
    )
  }
  if (input.published != null || mode === 'create') {
    payload.published = Boolean(input.published)
  }

  return payload
}

export async function getAllPublishedPosts(): Promise<BlogPostPreview[]> {
  const pb = getPb()
  const records = await pb.collection(POSTS_COLLECTION).getFullList({
    filter: 'published=true',
    sort: '-created',
    requestKey: null,
  })

  return records.map((record) => {
    const post = mapPost(pb as unknown as PocketBaseLike, record as unknown as Record<string, unknown>)
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      coverImage: post.coverImage,
      relatedProducts: post.relatedProducts,
      published: post.published,
      created: post.created,
      updated: post.updated,
    }
  })
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const normalized = toSafeText(slug, 300)
  if (!VALID_SLUG_REGEX.test(normalized)) return null

  const pb = getPb()
  const filter = `slug="${escapePbFilterValue(normalized)}" && published=true`

  try {
    const record = await pb.collection(POSTS_COLLECTION).getFirstListItem(filter, {
      requestKey: null,
    })
    return mapPost(pb as unknown as PocketBaseLike, record as unknown as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function getAdminPosts(): Promise<BlogPost[]> {
  const { pb } = await getAdminPbForAction()
  const records = await pb.collection(POSTS_COLLECTION).getFullList({
    sort: '-updated',
    requestKey: null,
  })
  return records.map((record) => mapPost(pb as unknown as PocketBaseLike, record as unknown as Record<string, unknown>))
}

export async function getAdminPostById(id: string): Promise<BlogPost | null> {
  assertPocketBaseId(id, 'post id')
  const { pb } = await getAdminPbForAction()

  try {
    const record = await pb.collection(POSTS_COLLECTION).getOne(id, { requestKey: null })
    return mapPost(pb as unknown as PocketBaseLike, record as unknown as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function createPost(input: PostUpsertInput): Promise<BlogPost> {
  const { pb } = await getAdminPbForAction()
  const payload = normalizeInput(input, 'create')
  let savedContentImages: string[] = []

  if (typeof payload.content === 'string' && payload.content) {
    const result = await replaceInlineContentImages(payload.content)
    payload.content = sanitizeHtmlContent(result.html)
    savedContentImages = result.savedPaths
  } else if (typeof payload.content === 'string') {
    payload.content = sanitizeHtmlContent(payload.content)
  }

  try {
    const created = await pb.collection(POSTS_COLLECTION).create(payload)
    return mapPost(pb as unknown as PocketBaseLike, created as unknown as Record<string, unknown>)
  } catch (error) {
    await deleteBlogImages(savedContentImages)
    throw error
  }
}

export async function updatePost(id: string, input: PostUpsertInput): Promise<BlogPost> {
  assertPocketBaseId(id, 'post id')
  const { pb } = await getAdminPbForAction()
  const existing = (await pb.collection(POSTS_COLLECTION).getOne(id, {
    requestKey: null,
  })) as unknown as Record<string, unknown>

  const payload = normalizeInput(input, 'update')
  const existingContent = sanitizeHtmlContent(existing.content)
  const oldContentImages = extractLocalBlogImagePathsFromHtml(existingContent)
  let savedContentImages: string[] = []

  if (typeof payload.content === 'string' && payload.content) {
    const result = await replaceInlineContentImages(payload.content)
    payload.content = sanitizeHtmlContent(result.html)
    savedContentImages = result.savedPaths
  } else if (typeof payload.content === 'string') {
    payload.content = sanitizeHtmlContent(payload.content)
  }

  try {
    const updated = await pb.collection(POSTS_COLLECTION).update(id, payload)
    if (typeof payload.content === 'string') {
      const newContentImages = extractLocalBlogImagePathsFromHtml(payload.content)
      for (const oldPath of oldContentImages) {
        if (!newContentImages.has(oldPath)) {
          await deleteBlogImageByValue(oldPath)
        }
      }
    }
    return mapPost(pb as unknown as PocketBaseLike, updated as unknown as Record<string, unknown>)
  } catch (error) {
    await deleteBlogImages(savedContentImages)
    throw error
  }
}

export async function deletePost(id: string): Promise<{ ok: true }> {
  assertPocketBaseId(id, 'post id')
  const { pb } = await getAdminPbForAction()
  const existing = (await pb.collection(POSTS_COLLECTION).getOne(id, {
    requestKey: null,
  })) as unknown as Record<string, unknown>
  const existingContent = sanitizeHtmlContent(existing.content)
  const contentImages = extractLocalBlogImagePathsFromHtml(existingContent)
  await pb.collection(POSTS_COLLECTION).delete(id)
  await deleteBlogImages(contentImages)
  return { ok: true }
}

export type AdminRelatedProductOption = {
  id: string
  name: string
  slug: string
  reference: string
  image: string
  price: number
  currency: string
}

export async function getAdminRelatedProductOptions(): Promise<AdminRelatedProductOption[]> {
  const { pb } = await getAdminPbForAction()
  const records = await pb.collection(PRODUCTS_COLLECTION).getFullList({
    sort: 'name',
    fields: 'id,name,slug,sku,images,price,promoPrice,currency,isActive',
    filter: 'isActive=true',
    requestKey: null,
  })

  return records.map((record) => {
    const rawRecord = record as unknown as Record<string, unknown>
    const images = Array.isArray(rawRecord.images) ? rawRecord.images : []
    const firstImage = images.find((value) => typeof value === 'string' && value.trim()) as string | undefined
    const basePrice = Number(rawRecord.price ?? 0)
    const promoPrice = Number(rawRecord.promoPrice ?? 0)
    const effectivePrice =
      Number.isFinite(promoPrice) && promoPrice > 0 && promoPrice < basePrice ? promoPrice : basePrice

    return {
      id: String(rawRecord.id ?? ''),
      name: toSafeText(rawRecord.name, 300) || 'Produit',
      slug: toSafeText(rawRecord.slug, 300),
      reference: toSafeText(rawRecord.sku, 100) || toSafeText(rawRecord.slug, 300),
      image: firstImage ? buildPbProductsFileUrl(String(rawRecord.id ?? ''), firstImage) : '',
      price: Number.isFinite(effectivePrice) ? effectivePrice : 0,
      currency: toSafeText(rawRecord.currency, 12) || 'EUR',
    }
  })
}
