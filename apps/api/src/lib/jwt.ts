import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  username: string;
  passkeyId: string;
}

export function extractTokenFromHeader(authHeader?: string): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  return authHeader.substring(7);
}

/**
 * Creates a JWT token for a user
 */
export async function createJWT(payload: JWTPayload): Promise<string> {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies a JWT token and returns its payload
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
