import { slugify } from '@/utils/slug'

const TARGET_CATEGORY_SLUGS = new Set([
  'panneau-effet-marbre',
  'panneau-mural-effet-marbre',
  'profile-mural-effet-bois',
  'profile-effet-bois-d-interieur',
  'profile-mural-effet-bois-d-interieur',
  'profile-mural-effet-bois-d-exterieur',
])

const CATEGORY_KEY_PATTERN =
  /(category|categories|categorie|categories|tag|tags|collection|collections)/i

const MAX_TRAVERSE_DEPTH = 7
const MAX_TRAVERSE_NODES = 500

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toCandidateTokens(value: string): string[] {
  const raw = value.trim()
  if (!raw) return []

  const normalized = slugify(raw)
  const splitParts = raw
    .split(/[|,;/]+/g)
    .map((part) => slugify(part))
    .filter(Boolean)

  return [normalized, ...splitParts]
}

function matchesTargetCategory(token: string): boolean {
  if (!token) return false
  if (TARGET_CATEGORY_SLUGS.has(token)) return true
  for (const target of TARGET_CATEGORY_SLUGS) {
    if (token.includes(target)) return true
  }
  return false
}

function collectCategoryBranchTokens(root: unknown): Set<string> {
  const tokens = new Set<string>()
  const stack: Array<{ value: unknown; inCategoryBranch: boolean; depth: number }> = [
    { value: root, inCategoryBranch: false, depth: 0 },
  ]
  const seen = new WeakSet<object>()
  let visitedNodes = 0

  while (stack.length > 0 && visitedNodes < MAX_TRAVERSE_NODES) {
    const current = stack.pop()
    if (!current) continue

    const { value, inCategoryBranch, depth } = current
    visitedNodes += 1
    if (depth > MAX_TRAVERSE_DEPTH || value == null) continue

    if (typeof value === 'string') {
      if (inCategoryBranch) {
        for (const token of toCandidateTokens(value)) {
          if (token) tokens.add(token)
        }
      }
      continue
    }

    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i -= 1) {
        stack.push({ value: value[i], inCategoryBranch, depth: depth + 1 })
      }
      continue
    }

    if (!isRecord(value)) continue
    if (seen.has(value)) continue
    seen.add(value)

    for (const [key, nextValue] of Object.entries(value)) {
      const nextInCategoryBranch = inCategoryBranch || CATEGORY_KEY_PATTERN.test(key)
      stack.push({ value: nextValue, inCategoryBranch: nextInCategoryBranch, depth: depth + 1 })
    }
  }

  return tokens
}

function getTargetCategoryIds(categories: unknown): Set<string> {
  const ids = new Set<string>()
  if (!Array.isArray(categories)) return ids

  for (const item of categories) {
    if (!isRecord(item)) continue

    const id = typeof item.id === 'string' ? item.id.trim() : ''
    if (!id) continue

    const slug = typeof item.slug === 'string' ? slugify(item.slug) : ''
    const name = typeof item.name === 'string' ? slugify(item.name) : ''
    if (TARGET_CATEGORY_SLUGS.has(slug) || TARGET_CATEGORY_SLUGS.has(name)) {
      ids.add(id)
    }
  }

  return ids
}

export function hasInstallationStepsCategory(product: unknown, categories?: unknown): boolean {
  const tokens = collectCategoryBranchTokens(product)

  for (const token of tokens) {
    if (matchesTargetCategory(token)) return true
  }

  const targetIds = getTargetCategoryIds(categories)
  if (targetIds.size === 0) return false

  for (const token of tokens) {
    if (targetIds.has(token)) return true
  }

  return false
}
