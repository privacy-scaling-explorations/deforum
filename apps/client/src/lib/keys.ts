import { trpc } from './trpc';
import { Identity } from '@semaphore-protocol/identity';

// Generate a new seed
function generateSeed(): string {
  const buffer = new Uint8Array(32);
  window.crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Download seed phrase as text file
function downloadSeedPhrase(seedPhrase: string): void {
  const element = document.createElement('a');
  const file = new Blob([seedPhrase], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = 'deforum_backup.txt';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
}

// Store private key in localStorage
export async function storePrivateKey(userId: string, identity: Identity): Promise<void> {
  const key = `pK_${userId}`;
  localStorage.setItem(key, identity.export());
}

// Get private key from localStorage
export async function getPrivateKey(userId: string): Promise<string | null> {
  const key = `pK_${userId}`;
  return localStorage.getItem(key);
}

export async function getIdentity(userId: string): Promise<Identity | null> {
  const key = `pK_${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? Identity.import(stored) : null;
}

// Register public key with server
export async function registerPublicKey(
  userId: string,
  publicKey: string,
  addPublicKey: ReturnType<typeof trpc.users.addPublicKey.useMutation>
): Promise<void> {
  await addPublicKey.mutateAsync({ userId, publicKey });
}

// Generate and register new key pair
export async function generateAndRegisterKeys(
  addPublicKey: ReturnType<typeof trpc.users.addPublicKey.useMutation>,
  userId: string
): Promise<void> {
  const seedEntropy = generateSeed();
  const identity = new Identity(seedEntropy);

  // Download seed phrase
  downloadSeedPhrase(seedEntropy);

  // Store private key locally
  await storePrivateKey(userId, identity);

  // Register public key
  await registerPublicKey(userId, identity.publicKey.toString(), addPublicKey);
}
