export interface OAuthKeys {
  googleClientId?: string;
  googleClientSecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  metaPixelId?: string;
}
export class CredentialStoreError extends Error {}
export function encryptionKey(raw?: string): Buffer;
export function storePath(): string;
export function readKeys(): OAuthKeys | null;
export function mergeKeys(updates: Partial<OAuthKeys>): void;
export function createStore(file: string, value: OAuthKeys, key?: Buffer): void;
