// Collect public route paths only, never query strings, order IDs or account URLs.
export function isTrackedPath(path: unknown): path is string {
  return typeof path === 'string' && path.length <= 200 && /^(\/|\/about|\/contact|\/blog|\/blog\/[a-zA-Z0-9-]+|\/product\/[a-zA-Z0-9-]+|\/policies\/(shipping|returns|privacy|terms))$/.test(path)
}
