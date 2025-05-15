import { getIdentity } from '@/lib/keys';
import { signMessage } from '@zk-kit/eddsa-poseidon';
import { Identity } from '@semaphore-protocol/identity';
import { poseidon3 } from 'poseidon-lite/poseidon3';

function stringToBigInt(str: string): bigint {
  // Encode the string into UTF-8 bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);

  // If the string is empty, represent it as 0n or handle as needed
  if (bytes.length === 0) {
    return 0n;
  }

  // Convert the byte array to a hexadecimal string
  let hex = '0x'; // Prefix for BigInt to recognize it as hex
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }

  // Convert the hex string to a BigInt
  return BigInt(hex);
}

export async function signPost(data: any) {
  const identityData = await getIdentity(data.author.id);
  const identity = identityData as Identity;
  if (!identity) throw new Error('No identity found');

  const messageHash = poseidon3([
    stringToBigInt(data.title),
    stringToBigInt(data.content),
    stringToBigInt(data.username)
  ]);
  return signMessage(identity.privateKey, messageHash);
}
