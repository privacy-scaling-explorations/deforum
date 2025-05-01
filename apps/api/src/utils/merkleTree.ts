import { MerkleTree } from '@deforum/shared/schemas/merkleRoot';
import { createHash } from 'crypto';

function hashPair(left: string, right: string): string {
  const input = Buffer.concat([
    Buffer.from(left.replace('0x', ''), 'hex'),
    Buffer.from(right.replace('0x', ''), 'hex')
  ]);
  return '0x' + createHash('sha256').update(input).digest('hex');
}

export function generateMerkleTree(publicKeys: string[]): MerkleTree {
  if (publicKeys.length === 0) {
    throw new Error('Cannot generate merkle tree with no public keys');
  }

  // Create leaf nodes
  let level = publicKeys.map(key => key.toLowerCase());
  const indices: Record<string, number> = {};
  level.forEach((key, index) => {
    indices[key] = index;
  });

  // Store all tree nodes
  const tree: string[] = [...level];

  // Build tree levels
  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = i + 1 < level.length ? level[i + 1] : left;
      nextLevel.push(hashPair(left, right));
    }
    level = nextLevel;
    tree.push(...level);
  }

  return {
    root: level[0],
    tree,
    indices,
  };
} 