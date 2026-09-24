import { z } from 'zod'
import { DEFAULT_SOCIAL_PROOF, socialProofSchema } from '@/lib/social-proof'

export const STORE_SETTINGS_ID = 'storeconfig0001'
const socialUrl = z.string().trim().max(2048).refine(value => {
  if (!value) return true
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password }
  catch { return false }
}, 'Enter a full HTTPS profile URL or leave blank.')
const socialLinksSchema = z.object({ instagram: socialUrl, facebook: socialUrl, tiktok: socialUrl })
export const storeSettingsSchema = z.object({
  socialLinks: socialLinksSchema.default({ instagram: '', facebook: '', tiktok: '' }),
  analyticsEnabled: z.boolean().default(false),
  firstOrderDiscountEnabled: z.boolean(),
  firstOrderDiscountPercent: z.number().int().min(1).max(99),
  businessName: z.string().trim().max(200),
  supportEmail: z.union([z.literal(''), z.email()]),
  businessAddress: z.string().trim().max(1000),
  shippingPolicy: z.string().trim().max(20000),
  returnPolicy: z.string().trim().max(20000),
  privacyPolicy: z.string().trim().max(20000),
  terms: z.string().trim().max(20000),
  storageInstructions: z.string().trim().max(2000).default(''),
  preparationInstructions: z.string().trim().max(2000).default(''),
  socialProof: socialProofSchema.default(DEFAULT_SOCIAL_PROOF),
})
export type StoreSettings = z.infer<typeof storeSettingsSchema>
export const EMPTY_STORE_SETTINGS: StoreSettings = {
  socialLinks: { instagram: '', facebook: '', tiktok: '' },
  analyticsEnabled: false,
  firstOrderDiscountEnabled: false, firstOrderDiscountPercent: 10,
  businessName: '', supportEmail: '', businessAddress: '',
  shippingPolicy: '', returnPolicy: '', privacyPolicy: '', terms: '',
  storageInstructions: '', preparationInstructions: '',
  socialProof: { ...DEFAULT_SOCIAL_PROOF, enabled: false, ratingsEnabled: false, testimonials: [] },
}

// Apply to undiscounted items only; existing product/category promotions take precedence.
export function firstOrderUnitPrice(baseCents: number, currentCents: number, percent: number) {
  if (!Number.isInteger(percent) || percent < 1 || percent > 99) throw new Error('Invalid first-order percentage.')
  return currentCents < baseCents ? currentCents : Math.max(1, Math.round(baseCents * (100 - percent) / 100))
}
