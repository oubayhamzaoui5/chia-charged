/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const products = app.findCollectionByNameOrId('products')
  products.fields.add(new TextField({ name: 'ingredients', max: 5000 }))
  products.fields.add(new TextField({ name: 'allergenStatement', max: 2000 }))
  products.fields.add(new JSONField({ name: 'nutritionFacts', maxSize: 32768 }))
  app.save(products)

  const nutritionFacts = {
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
    footnote: '*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.',
  }
  const strawberryIngredients = 'Chia Seed, Whey Protein Concentrate, Medium Chain Coconut Oil Triglycerides, Freeze Dried Strawberry Slices, Vanilla Flavor With Other Natural Flavors, Stevia Leaf Glycosides, Monk Fruit Extract.'
  const chocolateIngredients = 'Chia Seed, Whey Protein Concentrate, Chocolate Chips (Chocolate, Cane Sugar, Cocoa Butter, Sunflower Lecithin), Medium Chain Coconut Oil Triglycerides, Natural Flavor, Cocoa Powder (Alkaline Process), Stevia Leaf Glycosides, Monk Fruit Extract.'
  const allergenStatement = 'Contains milk. Produced in a facility with tree nuts, peanuts, soybeans, milk, eggs, wheat and sesame.'

  const records = app.findRecordsByFilter('products', '', '', 0, 0)
  for (const record of records) {
    const productText = `${record.getString('name')} ${record.getString('sku')} ${JSON.stringify(record.get('variantKey') || {})}`.toLowerCase()
    const isChocolate = productText.includes('chocolate') || productText.includes('choco') || productText.includes('chklt')
    const isStrawberry = productText.includes('strawberr') || productText.includes('fraise')
    if (!isChocolate && !isStrawberry) continue
    record.set('ingredients', isChocolate ? chocolateIngredients : strawberryIngredients)
    record.set('allergenStatement', allergenStatement)
    record.set('nutritionFacts', nutritionFacts)
    app.save(record)
  }
}, (app) => {
  const products = app.findCollectionByNameOrId('products')
  for (const name of ['ingredients', 'allergenStatement', 'nutritionFacts']) {
    products.fields.removeByName(name)
  }
  return app.save(products)
})
