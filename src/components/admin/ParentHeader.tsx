import Card from '@/components/admin/card'
import ProductGallery from '@/components/shop/product-gallery.client'
import VariantAttributesEditor from '@/components/admin/VariantAttributesEditor'

type Props = {
  parent: any
  variables: any[]
  onSave?: () => void
}

export default function ParentHeader({ parent, variables, onSave }: Props) {
  const imageUrls = Array.isArray(parent.images)
    ? parent.images.map(
        (img: string) =>
          `${process.env.NEXT_PUBLIC_PB_URL}/api/files/products/${parent.id}/${img}`
      )
    : []

  return (
    <Card className="space-y-8 p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={imageUrls} productName={parent.name} />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{parent.name}</h1>
          <p className="mb-6 text-foreground/60">Reference: {parent.sku}</p>
          <VariantAttributesEditor
            parentId={parent.id}
            initialVariantKey={Object.entries(parent.variantKey ?? {}).map(([key, value]) => ({
              key,
              value: String(value),
            }))}
            variables={variables ?? []}
            onSave={onSave}
          />
        </div>
      </div>
    </Card>
  )
}
