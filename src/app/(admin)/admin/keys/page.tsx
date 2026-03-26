import { getKeysStatusAction, getStripeKeysStatusAction } from './actions'
import KeysClient from './keys.client'

export const dynamic = 'force-dynamic'

export default async function KeysPage() {
  const [google, stripe] = await Promise.all([
    getKeysStatusAction(),
    getStripeKeysStatusAction(),
  ])
  return (
    <KeysClient
      googleConfigured={google.configured}
      googleClientIdMasked={google.clientIdMasked}
      stripeConfigured={stripe.configured}
      stripePublishableKeyMasked={stripe.publishableKeyMasked}
    />
  )
}
