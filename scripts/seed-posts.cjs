#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Seed script — creates 3 Chia Charged blog posts in PocketBase.
 *
 * Usage:
 *   node scripts/seed-posts.cjs
 *
 * Auth (same as migrate-slugs.cjs):
 *   PB_ADMIN_TOKEN  — preferred
 *   PB_ADMIN_EMAIL + PB_ADMIN_PASSWORD  — fallback
 */

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

  console.log('No admin credentials found — continuing unauthenticated (may fail on restricted collections).')
}

const POSTS = [
  {
    title: '22g of Protein Per Serving in a Pudding Cup: Here\'s How We Did It',
    slug: '22g-protein-pudding-how-we-did-it',
    excerpt: 'Most protein snacks sacrifice taste for macros. We refused to. Here\'s the exact approach we took to pack 22g of clean protein per serving into every single jar without touching artificial fillers.',
    published: true,
    relatedProducts: [],
    content: `<h2>The Problem With Most "High-Protein" Snacks</h2>
<p>Walk into any supermarket and you'll find shelves lined with products screaming "HIGH PROTEIN" on the label. Flip them over and you'll find a cocktail of artificial sweeteners, cheap fillers, and whey isolates that bloat you out within an hour.</p>
<p>We built Chia Charged because we were sick of choosing between real food and real results.</p>

<h2>The Protein Stack We Use</h2>
<p>Every jar of Chia Charged contains a specific blend of plant-based proteins that deliver a complete amino acid profile — no corners cut:</p>
<ul>
  <li><strong>Pea Protein Isolate</strong> — the backbone. High in BCAAs, easy to digest, neutral taste.</li>
  <li><strong>Chia Seeds</strong> — 14% protein by weight, plus omega-3s and fiber that slow absorption.</li>
  <li><strong>MCT Oil</strong> — not a protein source, but it keeps you satiated so those 22g per serving actually do their job.</li>
</ul>

<h2>Why 22g Per Serving Specifically?</h2>
<p>Research consistently shows that <strong>20–25g of protein per meal</strong> is the sweet spot for muscle protein synthesis. Less and you leave gains on the table. More and the excess gets converted to glucose anyway.</p>
<p>We landed on 22g per serving because it hits that window perfectly while keeping the texture smooth — not chalky, not dense.</p>

<h2>The Taste Test We Failed (and Fixed)</h2>
<p>Our first 12 batches failed the taste test. Too gritty. Too heavy. One batch tasted like a protein shake someone left in a pudding cup overnight.</p>
<p>The fix came from adjusting the chia-to-protein ratio and letting the mixture hydrate for exactly 8 hours. That's the secret. Time does what artificial thickeners never could.</p>

<h2>The Result</h2>
<p>22g of protein per serving. Real ingredients. A pudding you'd actually want to eat — not one you choke down because you feel you should.</p>
<p>That's the standard we hold every single jar to.</p>`,
  },

  {
    title: 'Chia Seeds: The Ancient Superfood Modern Science Just Caught Up To',
    slug: 'chia-seeds-superfood-science-explained',
    excerpt: 'The Aztecs ran on chia seeds for a reason. Turns out, 2,000 years of traditional use and modern nutritional science land on the exact same conclusion: chia might be the most efficient food on the planet.',
    published: true,
    relatedProducts: [],
    content: `<h2>What Makes Chia Seeds Different</h2>
<p>Most seeds are good at one thing. Chia seeds are exceptional at five:</p>
<ul>
  <li><strong>Omega-3 Fatty Acids</strong> — more ALA omega-3 per gram than salmon</li>
  <li><strong>Soluble Fiber</strong> — 12g per serving, forming a gel that slows sugar absorption</li>
  <li><strong>Complete Protein</strong> — one of the only plant sources with all essential amino acids</li>
  <li><strong>Calcium</strong> — more per gram than whole milk</li>
  <li><strong>Antioxidants</strong> — protecting the fats inside from oxidation, which is why they have a 2-year shelf life without preservatives</li>
</ul>

<h2>The Gel Factor</h2>
<p>When chia seeds absorb liquid, they form a hydrophilic gel up to <strong>12x their own weight</strong>. This isn't just a cool food science trick — it has real metabolic consequences:</p>
<ol>
  <li>It slows gastric emptying, keeping you full for 3–4 hours after eating</li>
  <li>It creates a physical barrier that slows glucose absorption — blunting blood sugar spikes</li>
  <li>It feeds beneficial gut bacteria, acting as a prebiotic</li>
</ol>

<h2>Why We Built Around Chia (Not Oats)</h2>
<p>The obvious base for a protein pudding would be oats. High carb, relatively cheap, familiar. But oats spike blood sugar. Oats require cooking. Oats don't have the omega-3 profile.</p>
<p>Chia seeds do everything oats do for satiety — without the glycemic hit. That was the trade we were willing to make.</p>

<h2>How We Source Ours</h2>
<p>We source single-origin organic chia from Bolivia, where the altitude and dry climate produce seeds with a consistently higher oil content. Higher oil = better omega-3 ratio = better product.</p>
<p>It costs more. We think it's worth it.</p>`,
  },

  {
    title: 'Why Most Protein Snacks Leave You Hungry an Hour Later',
    slug: 'why-protein-snacks-leave-you-hungry',
    excerpt: 'You eat a protein bar, feel full for 40 minutes, then raid the fridge anyway. It\'s not a willpower problem. It\'s a formulation problem. Here\'s what\'s actually happening — and why Chia Charged is built differently.',
    published: true,
    relatedProducts: [],
    content: `<h2>The 40-Minute Crash</h2>
<p>You know the feeling. You eat a protein bar or a shake, feel satisfied, then an hour later you're standing in front of the fridge wondering what happened.</p>
<p>Most people blame themselves. They shouldn't. The problem is in the product.</p>

<h2>Why Fast Protein Doesn't Keep You Full</h2>
<p>Most protein snacks are built around <strong>whey isolate</strong> — a fast-digesting protein that spikes amino acids in your blood quickly then drops off just as fast. Add in the sugar alcohols, maltodextrin, and cheap fillers most bars use as bulk, and you get a product that burns through your system in under an hour.</p>
<p>Your body registers the calorie hit, releases insulin, processes it, and then signals hunger again. The macros look great on paper. The satiety experience is garbage.</p>

<h2>The Three Pillars of Real Satiety</h2>
<p>Keeping someone full for 3–4 hours requires hitting three physiological levers at once:</p>
<ol>
  <li><strong>Slow-digesting protein</strong> — protein that releases amino acids gradually, not all at once</li>
  <li><strong>Soluble fiber</strong> — which forms a gel in the gut, physically slowing gastric emptying</li>
  <li><strong>Healthy fats</strong> — which trigger CCK, the hormone that signals fullness to your brain</li>
</ol>
<p>Most protein snacks hit only the first lever, partially. Chia Charged is built to hit all three.</p>

<h2>How Chia Charged Handles Each One</h2>

<h3>Slow protein</h3>
<p>We use pea protein isolate combined with the natural protein in chia seeds. Pea protein digests slower than whey — studies show it produces comparable muscle protein synthesis with a more sustained amino acid release curve. No crash.</p>

<h3>Soluble fiber from chia gel</h3>
<p>When chia seeds hydrate, they form a viscous gel that lines the gut and physically slows how fast everything moves through. This isn't a minor effect — research on chia gel shows it can reduce gastric emptying rate by a meaningful margin, directly extending the feeling of fullness.</p>

<h3>MCT oil</h3>
<p>Medium-chain triglycerides are absorbed differently than other fats — they go straight to the liver and convert to ketones rapidly, providing immediate energy while also triggering the fullness hormones. One tablespoon is enough to make a measurable difference in how long you stay satisfied.</p>

<h2>The Difference in Practice</h2>
<p>We've had customers tell us they eat one jar at 8am and genuinely don't think about food until noon. That's not a coincidence or a placebo — it's the three-lever system doing exactly what it was designed to do.</p>
<p>22g of protein per serving matters. But it only matters if the rest of the formula is built to make those 22g actually work.</p>`,
  },
]

async function main() {
  const rootDir = process.cwd()
  loadEnvLocal(rootDir)

  const url = process.env.NEXT_PUBLIC_PB_URL || process.env.POCKETBASE_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_PB_URL or POCKETBASE_URL in .env.local')
  }

  const pb = new PocketBase(url)
  await authIfPossible(pb)

  let created = 0
  let skipped = 0
  let failed = 0

  for (const post of POSTS) {
    // Check if slug already exists
    let exists = false
    try {
      await pb.collection('posts').getFirstListItem(`slug="${post.slug}"`, { requestKey: null })
      exists = true
    } catch {
      // not found — good, we can create it
    }

    if (exists) {
      console.log(`SKIP  "${post.title}" — slug already exists`)
      skipped++
      continue
    }

    try {
      await pb.collection('posts').create({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        relatedProducts: post.relatedProducts,
        published: post.published,
        coverImage: '',
      })
      console.log(`OK    "${post.title}"`)
      created++
    } catch (err) {
      console.error(`FAIL  "${post.title}" — ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${failed} failed`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
