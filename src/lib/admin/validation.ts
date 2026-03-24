import 'server-only'

const PB_ID_REGEX = /^[a-zA-Z0-9]{15}$/

export function assertPocketBaseId(value: string, label: string) {
  if (!PB_ID_REGEX.test(value)) {
    throw new Error(`Invalid ${label}`)
  }
}
