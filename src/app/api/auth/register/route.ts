import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const PB_URL =
  process.env.POCKETBASE_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  'http://127.0.0.1:8090'
const PHONE_PREFIX = '+216'
const PHONE_LOCAL_DIGITS_COUNT = 8

const emailValidator = z.string().email('Adresse email invalide')

const registerSchema = z
  .object({
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: z
      .string()
      .trim()
      .min(1, 'Le mot de passe est obligatoire')
      .min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
    passwordConfirm: z
      .string()
      .trim()
      .min(1, 'La confirmation du mot de passe est obligatoire'),
    surname: z
      .string()
      .trim()
      .min(1, 'Le prenom est obligatoire')
      .min(2, 'Le prenom doit contenir au moins 2 caracteres'),
    name: z
      .string()
      .trim()
      .min(1, 'Le nom est obligatoire')
      .min(2, 'Le nom doit contenir au moins 2 caracteres'),
    username: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const normalizedEmail = (data.email ?? '').trim()
    const normalizedPhoneInput = (data.phone ?? '').trim()
    if (!normalizedEmail && !normalizedPhoneInput) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: "L'email est obligatoire",
      })
    }
    if (normalizedEmail.length > 0 && !emailValidator.safeParse(normalizedEmail).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Adresse email invalide',
      })
    }

    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passwordConfirm'],
        message: 'Les mots de passe ne correspondent pas',
      })
    }

    if (normalizedPhoneInput.length > 0 && !normalizePhone(normalizedPhoneInput)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Le telephone doit etre au format +216 XX XXX XXX',
      })
    }
  })

function formatPhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, PHONE_LOCAL_DIGITS_COUNT)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
}

function extractLocalPhoneDigits(value: string): string {
  const trimmed = value.trim()
  const withoutPrefix = trimmed.startsWith(PHONE_PREFIX)
    ? trimmed.slice(PHONE_PREFIX.length)
    : trimmed

  let digits = withoutPrefix.replace(/\D/g, '')
  if (digits.startsWith('216') && digits.length > PHONE_LOCAL_DIGITS_COUNT) {
    digits = digits.slice(3)
  }
  return digits.slice(0, PHONE_LOCAL_DIGITS_COUNT)
}

function normalizePhone(value: string): string | null {
  const digits = extractLocalPhoneDigits(value)
  if (digits.length !== PHONE_LOCAL_DIGITS_COUNT) return null
  return `${PHONE_PREFIX} ${formatPhoneDigits(digits)}`
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[-_.]+|[-_.]+$/g, '')
}

function buildUsername(input: {
  username?: string
  surname: string
  name: string
  phone?: string
  email?: string
}): string {
  const preferred = slugify(input.username ?? '')
  if (preferred.length >= 3) return preferred.slice(0, 24)

  const fromName = slugify(`${input.surname}.${input.name}`)
  if (fromName.length >= 3) return fromName.slice(0, 24)

  const emailLocal = (input.email ?? '').split('@')[0] ?? ''
  const fromEmail = slugify(emailLocal)
  if (fromEmail.length >= 3) return fromEmail.slice(0, 24)

  const digits = phoneDigits(input.phone ?? '')
  if (digits.length >= 3) return `u${digits}`.slice(0, 24)

  return `user${Date.now().toString().slice(-8)}`
}

function buildFallbackEmail(phone: string): string {
  const digits = phoneDigits(phone) || Date.now().toString()
  const stamp = Date.now().toString().slice(-6)
  return `phone${digits}${stamp}@placeholder.local`
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { message: 'Trop de tentatives. Réessayez dans 1 heure.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const pb = new PocketBase(PB_URL)

    const phoneInput = (data.phone ?? '').trim()
    const normalizedPhone = phoneInput ? normalizePhone(phoneInput) : null
    if (phoneInput && !normalizedPhone) {
      return NextResponse.json(
        { message: 'Le telephone doit etre au format +216 XX XXX XXX' },
        { status: 400 }
      )
    }
    const normalizedEmail = (data.email ?? '').trim().toLowerCase()
    const finalEmail = normalizedEmail || (normalizedPhone ? buildFallbackEmail(normalizedPhone) : '')
    const username = buildUsername({
      username: data.username,
      surname: data.surname,
      name: data.name,
      phone: normalizedPhone ?? undefined,
      email: normalizedEmail,
    })
    const recordPayload: Record<string, unknown> = {
      email: finalEmail,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      surname: data.surname,
      name: data.name,
      username,
      role: 'customer',
      isActive: true,
      emailVisibility: Boolean(normalizedEmail),
    }
    if (normalizedPhone) {
      recordPayload.phone = normalizedPhone
    }

    const record = await pb.collection('users').create(recordPayload)

    if (normalizedEmail) {
      try {
        await pb.collection('users').requestVerification(normalizedEmail)
      } catch (verificationError) {
        console.error('Failed to send verification email:', verificationError)
      }
    }

    return NextResponse.json({
      message: normalizedEmail
        ? 'Inscription reussie. Verifiez votre email pour activer votre compte.'
        : 'Inscription reussie. Vous pouvez maintenant vous connecter.',
      user: {
        id: record.id,
        email: normalizedEmail || null,
        phone: record.phone ?? normalizedPhone ?? null,
        surname: record.surname,
        name: record.name,
        username: record.username,
      },
    })
  } catch (error: any) {
    console.error('Registration error:', error)

    if (error?.status === 400 && error?.data?.data) {
      const pbErrors = error.data.data
      const errorMessages: string[] = []
      const fieldErrors: Record<string, string> = {}

      Object.keys(pbErrors).forEach((field) => {
        const fieldError = pbErrors[field]
        if (!fieldError?.message) return

        let friendlyMessage = fieldError.message as string
        const lower = friendlyMessage.toLowerCase()

        if (field === 'email' && lower.includes('unique')) {
          friendlyMessage = "Cette adresse email est deja liee a un compte."
        } else if (field === 'username' && lower.includes('unique')) {
          friendlyMessage = "Ce nom d'utilisateur est deja utilise."
        } else if (field === 'phone' && lower.includes('unique')) {
          friendlyMessage = "Ce numero de telephone est deja lie a un compte."
        }

        fieldErrors[field] = friendlyMessage
        errorMessages.push(friendlyMessage)
      })

      return NextResponse.json(
        {
          message: errorMessages.join(', ') || 'Validation echouee',
          fieldErrors,
        },
        { status: 400 }
      )
    }

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

    return NextResponse.json(
      { message: 'Echec de l inscription. Veuillez reessayer.' },
      { status: 500 }
    )
  }
}
