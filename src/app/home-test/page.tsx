import type { Metadata } from 'next'
import Link from 'next/link'

import { Navbar } from '@/components/navbar'
import { getPb } from '@/lib/pb'
import type { ProductListItem } from '@/lib/services/product.service'
import HomeTestHero from './home-test-hero'

const HOME_TEST_PRODUCTS_LIMIT = 4
const BASE_PRODUCT_FILTER = 'isActive=true && (inView=true || inView=null) && stock > 0'

type PopularProduct = {
  id: string
  slug: string
  name: string
  description: string
  price: number
  promoPrice: number | null
  imageUrl: string
}

const fallbackPopularProducts: PopularProduct[] = [
  {
    id: 'fallback-marbre',
    slug: 'panneau-effet-marbre',
    name: 'Panneau Mural Effet Marbre',
    description: 'Finition pierre haut de gamme, pose rapide et entretien simple.',
    price: 189,
    promoPrice: null,
    imageUrl: '/pvc_marbre.webp',
  },
  {
    id: 'fallback-bois',
    slug: 'profile-effet-bois',
    name: 'Profilé Mural Effet Bois',
    description: 'Aspect naturel et ambiance chaleureuse pour les murs intérieurs.',
    price: 149,
    promoPrice: 129,
    imageUrl: '/pvc_bois.webp',
  },
  {
    id: 'fallback-pvc',
    slug: 'panneau-pvc-design',
    name: 'Panneau PVC Design 3D',
    description: 'Solution décorative moderne pour salon, cuisine et chambre.',
    price: 165,
    promoPrice: null,
    imageUrl: '/c1.webp',
  },
  {
    id: 'fallback-exterieur',
    slug: 'profile-exterieur',
    name: 'Profilé Extérieur Résistant',
    description: 'Conçu pour les façades et zones exposées à l’humidité.',
    price: 210,
    promoPrice: null,
    imageUrl: '',
  },
]

export const metadata: Metadata = {
  title: "Home Test | Update Design Tunisie",
  description:
    "Page d'accueil optimisée conversion pour revêtements muraux en Tunisie : marbre, bois et profilés design.",
}

function getPbBaseUrl(): string {
  return process.env.NEXT_PUBLIC_PB_URL ?? process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090'
}

function mapRecordToHomeProduct(record: any): ProductListItem {
  const images = Array.isArray(record.images) ? record.images : []
  const imageUrls = images.map(
    (filename: string) =>
      `${getPbBaseUrl()}/api/files/products/${record.id}/${encodeURIComponent(filename)}`
  )

  return {
    id: String(record.id ?? ''),
    slug: String(record.slug ?? ''),
    sku: String(record.sku ?? ''),
    name: String(record.name ?? ''),
    price: Number(record.price ?? 0),
    promoPrice: record.promoPrice == null ? null : Number(record.promoPrice),
    isActive: Boolean(record.isActive),
    inView: record.inView === undefined || record.inView === null ? true : Boolean(record.inView),
    description: String(record.description ?? ''),
    images,
    imageUrls,
    currency: String(record.currency ?? 'DT'),
    categories: Array.isArray(record.categories)
      ? record.categories.map(String)
      : record.category
        ? [String(record.category)]
        : [],
    isNew: Boolean(record.isNew),
    isVariant: Boolean(record.isVariant),
    isParent: Boolean(record.isParent),
    variantKey:
      record.variantKey && typeof record.variantKey === 'object'
        ? (record.variantKey as Record<string, string>)
        : {},
    stock: Number(record.stock ?? 0),
    inStock: Number(record.stock ?? 0) > 0,
  }
}

async function getHomeTestPopularProducts(): Promise<ProductListItem[]> {
  const ordered: ProductListItem[] = []
  const pb = getPb()

  try {
    const vedettesRes = await pb.collection('vedettes').getList(1, HOME_TEST_PRODUCTS_LIMIT, {
      sort: 'created',
      expand: 'product',
      fields:
        'id,product,expand.product.id,expand.product.slug,expand.product.sku,expand.product.name,expand.product.price,expand.product.promoPrice,expand.product.isActive,expand.product.inView,expand.product.description,expand.product.images,expand.product.currency,expand.product.categories,expand.product.category,expand.product.isNew,expand.product.isVariant,expand.product.stock',
      requestKey: null,
    })

    const selected = new Map<string, ProductListItem>()
    for (const item of vedettesRes.items) {
      const expanded = Array.isArray((item as any)?.expand?.product)
        ? (item as any).expand.product[0]
        : (item as any)?.expand?.product
      if (!expanded) continue

      const mapped = mapRecordToHomeProduct(expanded)
      if (!mapped.id) continue
      if (selected.has(mapped.id)) continue
      selected.set(mapped.id, mapped)
      if (selected.size >= HOME_TEST_PRODUCTS_LIMIT) break
    }

    if (selected.size > 0) {
      return Array.from(selected.values())
    }
  } catch {
    // Fallback to soldCount list.
  }

  try {
    const bestSellerRes = await pb.collection('products').getList(1, HOME_TEST_PRODUCTS_LIMIT, {
      sort: '-soldCount,-created',
      filter: BASE_PRODUCT_FILTER,
      fields:
        'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,stock',
      requestKey: null,
    })

    ordered.push(...bestSellerRes.items.map(mapRecordToHomeProduct))
  } catch {
    try {
      const latestRes = await pb.collection('products').getList(1, HOME_TEST_PRODUCTS_LIMIT, {
        sort: '-created',
        filter: BASE_PRODUCT_FILTER,
        fields:
          'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,stock',
        requestKey: null,
      })
      ordered.push(...latestRes.items.map(mapRecordToHomeProduct))
    } catch {
      // Keep the page rendering with placeholders.
    }
  }

  if (ordered.length < HOME_TEST_PRODUCTS_LIMIT) {
    try {
      const existingIds = new Set(ordered.map((item) => item.id))
      const fillRes = await pb.collection('products').getList(1, 24, {
        sort: '-created',
        filter: BASE_PRODUCT_FILTER,
        fields:
          'id,slug,sku,name,price,promoPrice,isActive,inView,description,images,currency,categories,category,isNew,isVariant,stock',
        requestKey: null,
      })

      for (const raw of fillRes.items) {
        const mapped = mapRecordToHomeProduct(raw)
        if (existingIds.has(mapped.id)) continue
        ordered.push(mapped)
        existingIds.add(mapped.id)
        if (ordered.length === HOME_TEST_PRODUCTS_LIMIT) break
      }
    } catch {
      // Ignore fill failures.
    }
  }

  return ordered.slice(0, HOME_TEST_PRODUCTS_LIMIT)
}

function toPopularProduct(product: ProductListItem): PopularProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    promoPrice: product.promoPrice,
    imageUrl: product.imageUrls[0] ?? '',
  }
}

function formatPriceTnd(value: number): string {
  return `${value.toFixed(3)} TND`
}

export default async function HomeTestPage() {
  const bestSellers = await getHomeTestPopularProducts()
  const popularProducts =
    bestSellers.length > 0
      ? bestSellers.slice(0, HOME_TEST_PRODUCTS_LIMIT).map(toPopularProduct)
      : fallbackPopularProducts

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <Navbar reserveSpace />

      <main>
        <HomeTestHero />

        <section className="bg-[#f8f8f6]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-[#111] md:text-3xl">
                Une métamorphose en quelques heures, pas en quelques semaines.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#3b3b3b] md:text-base">
                Nos panneaux muraux et profilés décoratifs sont pensés pour une rénovation rapide,
                sans démolition ni gros chantier. Vous modernisez votre intérieur sans bloquer votre
                maison pendant des jours.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#3b3b3b] md:text-base">
                Pose propre, poussière minimale, résultat immédiat. Cette approche est idéale pour
                les appartements, maisons et commerces en Tunisie où le temps de mise en service est
                un vrai levier de confort.
              </p>
            </div>

            <div className="relative min-h-[260px] overflow-hidden rounded-3xl bg-blue-900 md:min-h-[360px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("/aboutimg.webp")' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:py-16">
          <h2 className="text-2xl font-semibold text-[#111] md:text-3xl">Nos Solutions Design</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <article className="group overflow-hidden rounded-2xl border border-[#e9e9e6] bg-white transition duration-300 hover:scale-[1.02]">
              <div className="relative min-h-[180px] bg-blue-900">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: 'url("/pvc_bois.webp")' }}
                />
              </div>
              <div className="space-y-4 p-5">
                <h3 className="text-lg font-semibold">Profilés Muraux Bois</h3>
                <p className="text-sm text-[#4b4b4b]">
                  Une texture chaleureuse pour créer une atmosphère accueillante et élégante.
                </p>
                <Link
                  href="/boutique/categorie/profile-mural-effet-bois-d-interieur"
                  className="inline-flex rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b2b2b]"
                >
                  Découvrir
                </Link>
              </div>
            </article>

            <article className="group overflow-hidden rounded-2xl border border-[#e9e9e6] bg-white transition duration-300 hover:scale-[1.02]">
              <div className="relative min-h-[180px] bg-blue-600">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: 'url("/pvc_marbre.webp")' }}
                />
              </div>
              <div className="space-y-4 p-5">
                <h3 className="text-lg font-semibold">Panneaux Effet Marbre</h3>
                <p className="text-sm text-[#4b4b4b]">
                  L’apparence noble du marbre, avec une installation plus rapide et plus légère.
                </p>
                <Link
                  href="/boutique/categorie/panneau-mural-effet-marbre"
                  className="inline-flex rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b2b2b]"
                >
                  Découvrir
                </Link>
              </div>
            </article>

            <article className="group overflow-hidden rounded-2xl border border-[#e9e9e6] bg-white transition duration-300 hover:scale-[1.02]">
              <div className="min-h-[180px] bg-blue-900" />
              <div className="space-y-4 p-5">
                <h3 className="text-lg font-semibold">Profilés Extérieurs</h3>
                <p className="text-sm text-[#4b4b4b]">
                  Des finitions robustes conçues pour l’extérieur et les zones les plus exposées.
                </p>
                <Link
                  href="/boutique"
                  className="inline-flex rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b2b2b]"
                >
                  Découvrir
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className="bg-[#111]">
          <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              Quel style pour votre intérieur ?
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <h3 className="text-xl font-semibold text-[#d9b26a]">Ambiance Chaleureuse</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Les profilés bois structurent vos espaces et apportent une sensation naturelle,
                  cosy et contemporaine. Ils sont parfaits pour les salons, chambres et murs TV.
                </p>
              </article>

              <article className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <h3 className="text-xl font-semibold text-[#d9b26a]">Luxe Contemporain</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Les panneaux effet marbre renforcent l’impact visuel avec une signature haut de
                  gamme. Idéal pour un style premium dans les séjours, halls et espaces commerciaux.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:py-16">
          <h2 className="text-2xl font-semibold text-[#111] md:text-3xl">
            Pourquoi choisir Update Design pour vos projets en Tunisie ?
          </h2>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-[#333] md:text-base">
            <p>
              <strong>Durabilité :</strong> nos solutions murales sont pensées pour durer. Les
              matériaux sélectionnés conservent leur tenue esthétique dans le temps, même dans les
              pièces fortement sollicitées comme le salon, l’entrée ou les zones de passage.
            </p>
            <p>
              <strong>Résistance à l&apos;humidité :</strong> un critère essentiel en Tunisie. Les
              panneaux PVC et revêtements techniques résistent aux variations d&apos;humidité de la
              cuisine, de la salle de bain ou des appartements en zone côtière, tout en gardant une
              finition propre et stable.
            </p>
            <p>
              <strong>Esthétique 3D :</strong> textures bois, veines marbre et effets de relief
              transforment visuellement vos murs sans chantier lourd. Vous obtenez un rendu premium,
              moderne et immersif avec une mise en œuvre rapide.
            </p>
          </div>
        </section>

        <section className="bg-[#f8f8f6]">
          <div className="mx-auto max-w-7xl px-4 py-14 md:py-16">
            <h2 className="text-2xl font-semibold text-[#111] md:text-3xl">Nos Bestsellers</h2>

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {popularProducts.map((product) => {
                const hasPromo =
                  product.promoPrice != null &&
                  product.promoPrice > 0 &&
                  product.promoPrice < product.price
                const currentPrice = hasPromo ? Number(product.promoPrice) : product.price

                return (
                  <article
                    key={product.id}
                    className="overflow-hidden rounded-2xl border border-[#e7e7e4] bg-white"
                  >
                    {product.imageUrl ? (
                      <div className="relative h-52 bg-blue-600">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: `url("${product.imageUrl}")` }}
                        />
                      </div>
                    ) : (
                      <div className="h-52 bg-blue-600" />
                    )}

                    <div className="space-y-3 p-5">
                      <h3 className="line-clamp-2 text-base font-semibold">{product.name}</h3>
                      <p className="line-clamp-2 text-sm text-[#5a5a5a]">
                        {product.description || 'Revêtement mural premium pour intérieur moderne.'}
                      </p>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111]">
                          {formatPriceTnd(currentPrice)}
                        </span>
                        {hasPromo ? (
                          <span className="text-xs text-[#8a8a8a] line-through">
                            {formatPriceTnd(product.price)}
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={product.slug ? `/produit/${product.slug}` : '/boutique'}
                        className="inline-flex rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2b2b2b]"
                      >
                        Commander
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0f0f0f] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-semibold text-[#d9b26a]">Update Design Tunisie</h2>
            <p className="mt-3 text-sm text-white/80">
              Revêtements muraux premium pour projets résidentiels et commerciaux.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold">Adresse & Contact</h3>
            <p className="mt-3 text-sm text-white/80">
              Showroom : Avenue Habib Bourguiba, Tunis 1000
            </p>
            <p className="mt-1 text-sm text-white/80">Pôle logistique : Ben Arous, Tunisie</p>
            <a className="mt-2 block text-sm text-white/90 hover:text-[#d9b26a]" href="tel:+21655500011">
              +216 55 500 011
            </a>
          </div>

          <div>
            <h3 className="text-base font-semibold">Réseaux sociaux</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href="https://facebook.com/updatedesign"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:border-[#d9b26a] hover:text-[#d9b26a]"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com/updatedesign"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:border-[#d9b26a] hover:text-[#d9b26a]"
              >
                Instagram
              </a>
              <a
                href="mailto:contact@updatedesign.tn"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm transition hover:border-[#d9b26a] hover:text-[#d9b26a]"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

