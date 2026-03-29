import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import PocketBase from 'pocketbase'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const PB_URL =
  process.env.POCKETBASE_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL =
  process.env.PB_ADMIN_EMAIL ??
  process.env.POCKETBASE_ADMIN_EMAIL ??
  process.env.PB_SUPERUSER_EMAIL ??
  process.env.POCKETBASE_SUPERUSER_EMAIL ??
  ''
const PB_ADMIN_PASSWORD =
  process.env.PB_ADMIN_PASSWORD ??
  process.env.POCKETBASE_ADMIN_PASSWORD ??
  process.env.PB_SUPERUSER_PASSWORD ??
  process.env.POCKETBASE_SUPERUSER_PASSWORD ??
  ''
const PHONE_PREFIX = '+216'
const PHONE_COUNTRY_CODE = '216'
const PHONE_LOCAL_DIGITS_COUNT = 8
const INVALID_CREDENTIALS_MESSAGE = 'Email/telephone ou mot de passe invalide'

const loginSchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    password: z
      .string()
      .trim()
      .min(1, 'Le mot de passe est obligatoire')
      .min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  })
  .superRefine((data, ctx) => {
    const identifier = (data.identifier ?? data.email ?? '').trim()
    if (!identifier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identifier'],
        message: 'Email ou telephone requis',
      })
    }
  })

function escapePbString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function normalizePhoneIdentifier(value: string): string {
  return value.trim().replace(/[^\d+]/g, '').replace(/^00/, '+')
}

function formatPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, PHONE_LOCAL_DIGITS_COUNT)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
}

function extractLocalPhoneDigits(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === PHONE_LOCAL_DIGITS_COUNT) return digits
  if (
    digits.length === PHONE_COUNTRY_CODE.length + PHONE_LOCAL_DIGITS_COUNT &&
    digits.startsWith(PHONE_COUNTRY_CODE)
  ) {
    return digits.slice(PHONE_COUNTRY_CODE.length)
  }
  return null
}

function buildPhoneLookupVariants(identifier: string): string[] {
  const raw = identifier.trim()
  const normalized = normalizePhoneIdentifier(raw)
  const digitsOnly = normalized.replace(/\D/g, '')
  const localDigits = extractLocalPhoneDigits(raw) ?? extractLocalPhoneDigits(normalized)
  const variants = new Set<string>()

  if (raw) variants.add(raw)
  if (normalized) variants.add(normalized)
  if (digitsOnly) variants.add(digitsOnly)
  if (digitsOnly) variants.add(`+${digitsOnly}`)

  if (localDigits) {
    const localFormatted = formatPhoneDigits(localDigits)
    variants.add(localDigits)
    variants.add(localFormatted)
    variants.add(`${PHONE_COUNTRY_CODE}${localDigits}`)
    variants.add(`+${PHONE_COUNTRY_CODE}${localDigits}`)
    variants.add(`${PHONE_PREFIX}${localDigits}`)
    variants.add(`${PHONE_PREFIX} ${localFormatted}`)
  }

  return Array.from(variants).map((v) => v.trim()).filter(Boolean)
}

function dedupeIdentities(values: string[]): string[] {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const normalized = value.trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    output.push(normalized)
  }

  return output
}

async function createLookupPb(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL)
  if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) return pb

  try {
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
    return pb
  } catch {
    // Continue and try as regular users collection credentials.
  }

  try {
    await pb.collection('users').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
  } catch {
    // Fallback to anonymous lookup if admin auth is unavailable.
  }

  return pb
}

async function resolveIdentityCandidatesForLogin(
  pb: PocketBase,
  identifier: string
): Promise<{
  identities: string[]
  lookupRestricted: boolean
  matchedUser: boolean
}> {
  const raw = identifier.trim()
  if (raw.includes('@')) {
    return {
      identities: dedupeIdentities([raw.toLowerCase(), raw]),
      lookupRestricted: false,
      matchedUser: false,
    }
  }

  const variants = buildPhoneLookupVariants(raw)
  const localDigits = extractLocalPhoneDigits(raw)
  let lookupRestricted = false

  let user: Record<string, unknown> | null = null

  if (variants.length > 0) {
    const exactFilter = variants
      .map((phone) => `phone = "${escapePbString(phone)}"`)
      .join(' || ')

    user = await pb
      .collection('users')
      .getFirstListItem(exactFilter, {
        fields: 'email,username,phone',
        requestKey: null,
      })
      .catch((error: unknown) => {
        const e = error as { status?: number }
        if (e?.status === 404) return null
        if (e?.status === 403) {
          lookupRestricted = true
          return null
        }
        throw error
      })
  }

  if (!user && localDigits) {
    const localFormatted = formatPhoneDigits(localDigits)
    const containsFilter = [
      `phone ~ "${escapePbString(localFormatted)}"`,
      `phone ~ "${escapePbString(localDigits)}"`,
    ].join(' || ')

    user = await pb
      .collection('users')
      .getFirstListItem(containsFilter, {
        fields: 'email,username,phone',
        requestKey: null,
      })
      .catch((error: unknown) => {
        const e = error as { status?: number }
        if (e?.status === 404) return null
        if (e?.status === 403) {
          lookupRestricted = true
          return null
        }
        throw error
      })
  }

  const candidates: string[] = []
  if (user) {
    const username = String(user.username ?? '').trim()
    if (username) candidates.push(username)

    const email = String(user.email ?? '').trim()
    if (email) candidates.push(email.toLowerCase())
  }

  return {
    identities: dedupeIdentities([...candidates, ...variants, raw]),
    lookupRestricted,
    matchedUser: Boolean(user),
  }
}

async function authenticateWithCandidates(
  pb: PocketBase,
  identities: string[],
  password: string
) {
  let lastAuthError: unknown = null

  for (const identity of identities) {
    try {
      return await pb.collection('users').authWithPassword(identity, password)
    } catch (error: any) {
      if (error?.status === 400) {
        lastAuthError = error
        continue
      }
      throw error
    }
  }

  if (lastAuthError) throw lastAuthError
  throw new Error('No valid identity found for authentication.')
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
      { status: 429 }
    )
  }

  let attemptedIdentifier = ''
  let lookupRestricted = false
  let matchedUser = false

  try {
    const body = await request.json()

    const parsed = loginSchema.parse(body)
    const identifier = (parsed.identifier ?? parsed.email ?? '').trim()
    attemptedIdentifier = identifier
    const password = parsed.password

    const pb = new PocketBase(PB_URL)
    const lookupPb = await createLookupPb()
    const resolvedIdentities = await resolveIdentityCandidatesForLogin(lookupPb, identifier)
    lookupRestricted = resolvedIdentities.lookupRestricted
    matchedUser = resolvedIdentities.matchedUser
    const authData = await authenticateWithCandidates(pb, resolvedIdentities.identities, password)

    if (!authData.record) {
      return NextResponse.json({ message: 'Identifiants invalides' }, { status: 401 })
    }

    if (authData.record.isActive === false) {
      return NextResponse.json(
        { message: 'Ce compte est desactive. Veuillez contacter le support.' },
        { status: 403 }
      )
    }

    const isHttpsRequest =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.nextUrl.protocol === 'https:' ||
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') === true

    const cookieStore = await cookies()
    const authCookie = JSON.stringify({
      token: authData.token,
      record: {
        id: authData.record.id,
        email: authData.record.email,
        phone: authData.record.phone,
        surname: authData.record.surname,
        name: authData.record.name,
        username: authData.record.username,
        role: authData.record.role || 'customer',
        isActive: authData.record.isActive !== false,
        verified: authData.record.verified || false,
        avatar: authData.record.avatar || undefined,
      },
    })

    cookieStore.set('pb_auth', authCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttpsRequest,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: authData.record.id,
        email: authData.record.email,
        phone: authData.record.phone,
        surname: authData.record.surname,
        name: authData.record.name,
        username: authData.record.username,
        role: authData.record.role || 'customer',
        isActive: authData.record.isActive !== false,
        verified: authData.record.verified || false,
        avatar: authData.record.avatar || undefined,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const flattened =
        error.flatten().fieldErrors as Record<string, string[] | undefined>
      const fieldErrors: Record<string, string> = {}
      Object.keys(flattened).forEach((key) => {
        const message = flattened[key]?.[0]
        if (message) fieldErrors[key] = message
      })
      return NextResponse.json(
        {
          message: error.issues[0]?.message ?? 'Requete invalide',
          fieldErrors,
        },
        { status: 400 }
      )
    }

    if (error?.status === 400) {
      const rawMessage =
        typeof error?.data?.message === 'string'
          ? error.data.message
          : typeof error?.message === 'string'
            ? error.message
            : ''
      const normalizedMessage = rawMessage.trim()
      const isPhoneAttempt =
        !attemptedIdentifier.includes('@') &&
        Boolean(extractLocalPhoneDigits(attemptedIdentifier) ?? normalizePhoneIdentifier(attemptedIdentifier))
      const hasAdminLookupCredentials = Boolean(PB_ADMIN_EMAIL && PB_ADMIN_PASSWORD)
      const isLookupConfigIssue =
        isPhoneAttempt &&
        lookupRestricted &&
        !matchedUser &&
        !hasAdminLookupCredentials
      const lowerMessage = normalizedMessage.toLowerCase()
      const isPocketBaseAuthFailure = lowerMessage.includes('failed to authenticate')

      if (isLookupConfigIssue) {
        return NextResponse.json(
          { message: 'Connexion par telephone indisponible pour le moment. Utilisez votre email.' },
          { status: 503 }
        )
      }

      return NextResponse.json(
        {
          message:
            normalizedMessage && normalizedMessage.length > 0 && !isPocketBaseAuthFailure
              ? normalizedMessage
              : INVALID_CREDENTIALS_MESSAGE,
        },
        { status: 401 }
      )
    }

    console.error('Login error:', error)

    return NextResponse.json(
      { message: 'Une erreur est survenue pendant la connexion' },
      { status: 500 }
    )
  }
}
