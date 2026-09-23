import { z } from 'zod'

export const testimonialSchema = z.object({
 id: z.string().min(1).max(80), name: z.string().trim().min(1).max(100), role: z.string().trim().max(100),
 rating: z.number().int().min(1).max(5), quote: z.string().trim().min(1).max(2000),
 avatar: z.string().max(2000).refine(value => value === '' || (value.startsWith('/') && !value.startsWith('//')) || /^https:\/\//.test(value), 'Use an HTTPS image URL or a local /image path.'),
 rotate: z.enum(['-1.5deg', '0.3deg', '1.2deg']), enabled: z.boolean(), verified: z.boolean(),
})
export const socialProofSchema = z.object({
 enabled: z.boolean(), ratingsEnabled: z.boolean(), averageRating: z.number().min(0).max(5),
 reviewCount: z.string().trim().max(30), customerCount: z.string().trim().max(30),
 testimonials: z.array(testimonialSchema).max(12),
}).refine(value => new Set(value.testimonials.map(item => item.id)).size === value.testimonials.length, 'Review IDs must be unique.')
export type SocialProof = z.infer<typeof socialProofSchema>
export const DEFAULT_SOCIAL_PROOF: SocialProof = {
  "enabled": true,
  "ratingsEnabled": true,
  "averageRating": 4.8,
  "reviewCount": "100+",
  "customerCount": "500+",
  "testimonials": [
    {
      "name": "Sarah M.",
      "role": "Fitness Coach",
      "rating": 5,
      "quote": "I've tried every protein product on the market. Chia Charged is the only one that tastes like actual food, keeps me full until lunch, and doesn't wreck my stomach.",
      "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&q=80&fit=crop&crop=face",
      "rotate": "-1.5deg",
      "id": "review-1",
      "enabled": true,
      "verified": true
    },
    {
      "name": "James T.",
      "role": "Marathon Runner",
      "rating": 5,
      "quote": "I prep 5 jars every Sunday. Between the MCT oil and the chia seeds, my energy is steady through my morning runs. No gel packs needed.",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&q=80&fit=crop&crop=face",
      "rotate": "0.3deg",
      "id": "review-2",
      "enabled": true,
      "verified": true
    },
    {
      "name": "Layla K.",
      "role": "Nutritionist",
      "rating": 5,
      "quote": "As a nutritionist, I'm extremely picky about what I recommend. Zero added sugar, 22g plant protein per serving, and MCT oil — this is the one I tell all my clients about.",
      "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&q=80&fit=crop&crop=face",
      "rotate": "1.2deg",
      "id": "review-3",
      "enabled": true,
      "verified": true
    }
  ]
}
