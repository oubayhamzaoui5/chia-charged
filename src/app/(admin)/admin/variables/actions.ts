'use server'

import { revalidatePath } from 'next/cache'

import { getAdminPbForAction } from '@/lib/admin/actions'
import { assertPocketBaseId } from '@/lib/admin/validation'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

export async function createVariableAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? '').trim()

  if (!name) throw new Error('Variable name is required')
  if (type !== 'image') throw new Error('Only image variables are supported')

  const safe = new FormData()
  safe.set('name', name)
  safe.set('type', 'image')

  const image = formData.get('image')
  if (!(image instanceof File) || image.size === 0) {
    throw new Error('Image file is required')
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    throw new Error('File type not allowed. Use JPEG, PNG, WEBP, or GIF.')
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error('File is too large. Maximum size: 5 MB.')
  }
  safe.set('image', image)

  const { pb } = await getAdminPbForAction()
  const created = await pb.collection('variables').create(safe)
  revalidatePath('/admin/variables')
  revalidatePath('/admin/products')
  return created
}

export async function deleteVariableAction(id: string) {
  assertPocketBaseId(id, 'variable id')
  const { pb } = await getAdminPbForAction()
  await pb.collection('variables').delete(id)
  revalidatePath('/admin/variables')
  revalidatePath('/admin/products')
  return { ok: true }
}
