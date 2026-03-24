#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const PocketBase = require('pocketbase/cjs')

function loadEnvLocal(rootDir) {
  const envPath = path.join(rootDir, '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function slugify(input) {
  const normalized = String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueSlug(baseSlug, used) {
  if (!used.has(baseSlug)) return baseSlug
  let i = 2
  while (used.has(`${baseSlug}-${i}`)) i += 1
  return `${baseSlug}-${i}`
}

async function authIfPossible(pb) {
  const token = process.env.PB_ADMIN_TOKEN
  if (token) {
    pb.authStore.save(token, null)
    console.log('Using PB_ADMIN_TOKEN for authentication.')
    return
  }

  const email = process.env.PB_ADMIN_EMAIL
  const password = process.env.PB_ADMIN_PASSWORD
  if (email && password) {
    await pb.collection('_superusers').authWithPassword(email, password)
    console.log('Authenticated as superuser via PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD.')
    return
  }

  console.log('No admin credentials found (PB_ADMIN_TOKEN or PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD).')
  console.log('Continuing unauthenticated; updates may fail if rules are restricted.')
}

async function migrateCollection(pb, collectionName, sourceField) {
  const records = await pb.collection(collectionName).getFullList(2000, {
    fields: 'id,slug,name',
    sort: 'created',
  })

  const used = new Set()
  for (const r of records) {
    const s = String(r.slug || '').trim()
    if (s) used.add(s)
  }

  let changed = 0
  let failed = 0
  for (const r of records) {
    const source = String(r[sourceField] || r.slug || '')
    const base = slugify(source)
    if (!base) continue
    const current = String(r.slug || '')
    used.delete(current)
    const target = uniqueSlug(base, used)
    used.add(target)
    if (target === current) continue

    try {
      await pb.collection(collectionName).update(r.id, { slug: target })
      changed += 1
      console.log(`[${collectionName}] ${current} -> ${target}`)
    } catch (err) {
      failed += 1
      console.error(`[${collectionName}] Failed to update ${r.id}: ${err.message}`)
    }
  }

  return { changed, failed, total: records.length }
}

async function main() {
  const rootDir = process.cwd()
  loadEnvLocal(rootDir)

  const url = process.env.NEXT_PUBLIC_PB_URL || process.env.POCKETBASE_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_PB_URL or POCKETBASE_URL.')
  }

  const pb = new PocketBase(url)
  await authIfPossible(pb)

  const products = await migrateCollection(pb, 'products', 'name')
  const categories = await migrateCollection(pb, 'categories', 'name')

  console.log('\nMigration summary:')
  console.log(`products: ${products.changed} updated, ${products.failed} failed, ${products.total} total`)
  console.log(`categories: ${categories.changed} updated, ${categories.failed} failed, ${categories.total} total`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
