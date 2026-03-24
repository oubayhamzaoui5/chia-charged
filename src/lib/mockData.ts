export type LuxeNavItem = {
  label: string
  href: string
}

export type LuxeCategory = {
  id: string
  title: string
  href: string
  image: string
  description: string
}

export type LuxeProduct = {
  id: string
  name: string
  slug: string
  priceEuro: number
  image: string
  category: string
}

export type LuxeValue = {
  id: string
  title: string
  description: string
}

export type StudioMember = {
  id: string
  name: string
  role: string
  image: string
}

export const luxeNav: LuxeNavItem[] = [
  { label: 'Collections', href: '/boutique' },
  { label: 'A Propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
]

export const homeCategories: LuxeCategory[] = [
  {
    id: 'suspensions',
    title: 'Suspensions',
    href: '/boutique?category=suspensions',
    image: '/aboutimg.webp',
    description: 'Volumes aeriens et silhouettes architecturales.',
  },
  {
    id: 'lampes-table',
    title: 'Lampes de Table',
    href: '/boutique?category=lampes-table',
    image: '/aboutimg.webp',
    description: 'Lumiere d ambiance pour salon, bureau et chambre.',
  },
  {
    id: 'appliques-murales',
    title: 'Appliques Murales',
    href: '/boutique?category=appliques-murales',
    image: '/aboutimg.webp',
    description: 'Eclairage mural precis pour rythmer les espaces.',
  },
]

export const featuredProducts: LuxeProduct[] = [
  {
    id: 'prod-1',
    name: 'Suspension Halo en Laiton',
    slug: 'suspension-halo-laiton',
    priceEuro: 890,
    image: '/aboutimg.webp',
    category: 'Suspensions',
  },
  {
    id: 'prod-2',
    name: 'Lampe de Table Verre Fume',
    slug: 'lampe-table-verre-fume',
    priceEuro: 420,
    image: '/aboutimg.webp',
    category: 'Lampes de Table',
  },
  {
    id: 'prod-3',
    name: 'Applique Murale Marbre Noir',
    slug: 'applique-murale-marbre-noir',
    priceEuro: 560,
    image: '/aboutimg.webp',
    category: 'Appliques Murales',
  },
  {
    id: 'prod-4',
    name: 'Lampadaire Atelier Signature',
    slug: 'lampadaire-atelier-signature',
    priceEuro: 990,
    image: '/aboutimg.webp',
    category: 'Lampadaires',
  },
]

export const trustItems = [
  { id: 'shipping', title: 'Livraison Offerte', description: 'Sur toutes les commandes premium.' },
  { id: 'expertise', title: 'Expertise Design', description: 'Conseil personnalise par nos specialistes.' },
  { id: 'payment', title: 'Paiement Securise', description: 'Transactions protegees et chiffrees.' },
  { id: 'support', title: 'Service Client Dedie', description: 'Accompagnement attentif 7j/7.' },
]

export const aboutNarrative =
  'Depuis notre atelier parisien, nous cultivons une vision precise de la lumiere comme matiere architecturale. Notre maison est nee d une conviction simple: un interieur reussi se construit avec des pieces qui racontent une histoire et qui traversent le temps. Nous composons chaque collection autour d un dialogue entre heritage decoratif et lignes contemporaines, afin de proposer une lecture elegante du design francais. Nos equipes selectionnent des luminaires et objets a forte presence visuelle, puis evaluent leur comportement dans des contextes reels: salon, chambre, couloir, bureau et espace d accueil. Cette approche nous permet de recommander des solutions coherentes, au service du confort visuel et du caractere du lieu. Nous privilegions les materiaux nobles, notamment le laiton, le verre souffle et le marbre, pour leur capacite a capter, diffuser et sublimer la lumiere. Chaque finition est analysee pour sa durabilite, sa profondeur et sa facon de vieillir avec grace. En collaboration avec des artisans, designers et manufactures europeennes, nous defendons une production rigoureuse, respectueuse des gestes traditionnels et des contraintes actuelles de durabilite. Au dela du style, nous pensons l ambiance comme une composition technique: temperature de couleur, intensite, direction du flux lumineux et interaction avec les textures. Nos recommandations integres prennent en compte la hauteur sous plafond, la tonalite des murs, la presence de bois, de pierre ou de textile, ainsi que les usages quotidiens de chaque piece. Cette methode permet de doser precisement les contrastes, de valoriser les volumes et d eviter les zones visuelles fatigantes. Nous accompagnons aussi nos clients dans la lecture des performances: efficacite energetique, qualite des composants, maintenance et perennite des finitions. Notre engagement est clair: associer exigence esthetique, intelligence technique et service humain pour creer des interieurs ou la lumiere devient une signature intime, durable et memorable. Cette promesse guide chaque conseil, chaque selection et chaque projet livre.'

export const aboutValues: LuxeValue[] = [
  {
    id: 'qualite',
    title: 'Qualite',
    description: 'Selection stricte des pieces, controles de finition et materiaux premium.',
  },
  {
    id: 'durabilite',
    title: 'Durabilite',
    description: 'Produits concus pour durer et limiter le renouvellement decoratif.',
  },
  {
    id: 'innovation',
    title: 'Innovation',
    description: 'Curation technique des sources lumineuses et des nouveaux usages.',
  },
]

export const studioMembers: StudioMember[] = [
  {
    id: 'm1',
    name: 'Claire Martin',
    role: 'Directrice Artistique',
    image: '/aboutimg.webp',
  },
  {
    id: 'm2',
    name: 'Julien Roche',
    role: 'Curateur Lumiere',
    image: '/aboutimg.webp',
  },
  {
    id: 'm3',
    name: 'Nora El Hadi',
    role: 'Responsable Studio',
    image: '/aboutimg.webp',
  },
]

