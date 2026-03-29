import { getKeysStatusAction, getStripeKeysStatusAction, getMetaPixelStatusAction } from './actions'
import KeysClient from './keys.client'

export const dynamic = 'force-dynamic'

export default async function KeysPage() {
  const [google, stripe, meta] = await Promise.all([
    getKeysStatusAction(),
    getStripeKeysStatusAction(),
    getMetaPixelStatusAction(),
  ])
  return (
    <KeysClient
      googleConfigured={google.configured}
      googleClientIdMasked={google.clientIdMasked}
      stripeConfigured={stripe.configured}
      stripePublishableKeyMasked={stripe.publishableKeyMasked}
      metaConfigured={meta.configured}
      metaPixelIdMasked={meta.pixelIdMasked}
    />
  )
}
