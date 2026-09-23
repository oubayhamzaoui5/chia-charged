export type ProductNutritionRow = {
  label: string
  dailyValue: string
  indent: 0 | 1 | 2
  bold: boolean
  dividerBefore: boolean
}

export type ProductNutritionFacts = {
  servingsPerContainer: string
  servingSize: string
  calories: string
  rows: ProductNutritionRow[]
  footnote: string
}

export const DEFAULT_PRODUCT_NUTRITION: ProductNutritionFacts = {
  servingsPerContainer: '8 servings per container',
  servingSize: '1/4 cup (57g)',
  calories: '280',
  rows: [
    { label: 'Total Fat 14g', dailyValue: '18%', indent: 0, bold: true, dividerBefore: false },
    { label: 'Saturated Fat 5g', dailyValue: '25%', indent: 1, bold: false, dividerBefore: false },
    { label: 'Trans Fat 0g', dailyValue: '', indent: 1, bold: false, dividerBefore: false },
    { label: 'Cholesterol 60mg', dailyValue: '20%', indent: 0, bold: true, dividerBefore: false },
    { label: 'Sodium 55mg', dailyValue: '2%', indent: 0, bold: true, dividerBefore: false },
    { label: 'Total Carbohydrate 16g', dailyValue: '6%', indent: 0, bold: true, dividerBefore: false },
    { label: 'Dietary Fiber 12g', dailyValue: '43%', indent: 1, bold: false, dividerBefore: false },
    { label: 'Total Sugars 2g', dailyValue: '', indent: 1, bold: false, dividerBefore: false },
    { label: 'Includes 2g Added Sugars', dailyValue: '4%', indent: 2, bold: false, dividerBefore: false },
    { label: 'Protein 22g', dailyValue: '', indent: 0, bold: true, dividerBefore: false },
    { label: 'Vitamin D 0mcg', dailyValue: '0%', indent: 0, bold: false, dividerBefore: true },
    { label: 'Calcium 250mg', dailyValue: '20%', indent: 0, bold: false, dividerBefore: false },
    { label: 'Iron 2.3mg', dailyValue: '15%', indent: 0, bold: false, dividerBefore: false },
    { label: 'Potassium 330mg', dailyValue: '8%', indent: 0, bold: false, dividerBefore: false },
  ],
  footnote:
    '*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.',
}

export const DEFAULT_ALLERGEN_STATEMENT =
  'Contains milk. Produced in a facility with tree nuts, peanuts, soybeans, milk, eggs, wheat and sesame.'

export const STRAWBERRY_INGREDIENTS =
  'Chia Seed, Whey Protein Concentrate, Medium Chain Coconut Oil Triglycerides, Freeze Dried Strawberry Slices, Vanilla Flavor With Other Natural Flavors, Stevia Leaf Glycosides, Monk Fruit Extract.'

export const CHOCOLATE_CHIP_INGREDIENTS =
  'Chia Seed, Whey Protein Concentrate, Chocolate Chips (Chocolate, Cane Sugar, Cocoa Butter, Sunflower Lecithin), Medium Chain Coconut Oil Triglycerides, Natural Flavor, Cocoa Powder (Alkaline Process), Stevia Leaf Glycosides, Monk Fruit Extract.'

export const EMPTY_PRODUCT_NUTRITION: ProductNutritionFacts = {
  servingsPerContainer: '', servingSize: '', calories: '', rows: [], footnote: '',
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export function normalizeProductNutrition(value: unknown): ProductNutritionFacts {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = null
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return structuredClone(EMPTY_PRODUCT_NUTRITION)
  }

  const input = parsed as Record<string, unknown>
  const rawRows = Array.isArray(input.rows) ? input.rows : []
  const rows = rawRows
    .slice(0, 30)
    .map((raw): ProductNutritionRow | null => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
      const row = raw as Record<string, unknown>
      const label = cleanText(row.label, 120)
      if (!label) return null
      const indent = Number(row.indent)
      return {
        label,
        dailyValue: cleanText(row.dailyValue, 30),
        indent: indent === 1 || indent === 2 ? indent : 0,
        bold: Boolean(row.bold),
        dividerBefore: Boolean(row.dividerBefore),
      }
    })
    .filter((row): row is ProductNutritionRow => row !== null)

  return {
    servingsPerContainer:
      cleanText(input.servingsPerContainer, 120),
    servingSize: cleanText(input.servingSize, 120),
    calories: cleanText(input.calories, 30),
    rows,
    footnote: cleanText(input.footnote, 1000),
  }
}
