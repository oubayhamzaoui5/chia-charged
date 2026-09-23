import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServicePb } from '@/lib/pb-service.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  purpose: z.enum(['general', 'order', 'product', 'partnership', 'other']),
  subject: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional().default(''),
})

export async function POST(request: NextRequest) {
  try {
    const declared = Number(request.headers.get('content-length') || 0)
    if (declared > 12_000) return NextResponse.json({ message: 'Message is too large.' }, { status: 413 })
    const raw = await request.text()
    if (Buffer.byteLength(raw, 'utf8') > 12_000) return NextResponse.json({ message: 'Message is too large.' }, { status: 413 })
    const input = schema.parse(JSON.parse(raw))
    const email = input.email.toLowerCase()
    const requestHash = createHash('sha256').update(`${getClientIp(request)}:${email}`).digest('hex')
    const limit = await rateLimit(`contact:${requestHash}`, 5, 60 * 60 * 1000)
    if (!limit.allowed) return NextResponse.json({ message: 'Too many messages. Try again later.' }, { status: 429 })
    const pb = await createServicePb()
    const record = await pb.send<{ id: string }>('/api/chia-support/submit', { method: 'POST', body: { ...input, email, requestHash } })
    return NextResponse.json({ ok: true, reference: String(record.id).slice(-8) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ message: 'Check the form and try again.' }, { status: 400 })
    console.error('Contact submission failed:', error)
    return NextResponse.json({ message: 'Could not save your message. Try again.' }, { status: 500 })
  }
}
