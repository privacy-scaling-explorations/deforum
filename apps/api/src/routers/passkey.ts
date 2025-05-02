import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { randomUUID } from 'crypto';
import { TRPCError } from '@trpc/server';

// In-memory store for demo (replace with Redis/DB in prod)
const challengeStore = new Map<string, any>();

const RP_NAME = 'Deforum';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

function isCredentialMeta(meta: unknown): meta is { credentialId: string; publicKey?: string; counter?: number } {
  return !!meta && typeof meta === 'object' && !Array.isArray(meta) && 'credentialId' in meta;
}

export const passkeyRouter = router({
  beginRegistration: publicProcedure
    .input(z.object({ username: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      // Generate registration options (discoverable)
      const userId = randomUUID();
      const userIdBuffer = Buffer.from(userId.replace(/-/g, ''), 'hex');
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: userIdBuffer,
        userName: input.username || userId,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred',
        },
        timeout: 60000,
      });
      challengeStore.set(options.challenge, { userId, username: input.username });
      return { ...options };
    }),

  finishRegistration: publicProcedure
    .input(z.object({
      attestation: z.any(),
      challenge: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const expected = challengeStore.get(input.challenge);
      if (!expected) throw new Error('Invalid or expired challenge');
      const verification = await verifyRegistrationResponse({
        response: input.attestation,
        expectedChallenge: input.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
      if (!verification.verified || !verification.registrationInfo) throw new Error('Registration failed');
      const { credential } = verification.registrationInfo;
      // Find or create user
      let user: any = null;
      if (expected.username) {
        user = await ctx.prisma.user.findFirst({ where: { username: expected.username } });
      }
      if (!user) {
        user = await ctx.prisma.user.create({
          data: {
            username: expected.username || `user-${expected.userId.slice(0, 8)}`,
            isAnon: false,
            showFollowers: true,
            showFollowing: false,
          },
        });
      }
      // Issue passkey badge (store credential in metadata)
      const passkeyBadge = await ctx.prisma.badgeDefinition.findUnique({ where: { slug: 'passkey' } });
      if (passkeyBadge) {
        await ctx.prisma.badgeCredential.create({
          data: {
            userId: user.id,
            badgeId: passkeyBadge.id,
            isPublic: true,
            verifiedAt: new Date(),
            metadata: {
              credentialId: typeof credential.id === 'string' ? credential.id : Buffer.from(credential.id).toString('base64url'),
              publicKey: Buffer.isBuffer(credential.publicKey)
                ? credential.publicKey.toString('base64url')
                : typeof credential.publicKey === 'string'
                ? credential.publicKey
                : Buffer.from(credential.publicKey).toString('base64url'),
              counter: credential.counter,
            },
          },
        });
      }
      challengeStore.delete(input.challenge);
      return {
        success: true,
        userId: user.id,
        credentialID: typeof credential.id === 'string' ? credential.id : Buffer.from(credential.id).toString('base64url'),
        publicKey: Buffer.isBuffer(credential.publicKey)
          ? credential.publicKey.toString('base64url')
          : typeof credential.publicKey === 'string'
          ? credential.publicKey
          : Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
      };
    }),

  beginLogin: publicProcedure
    .input(z.object({ username: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      // Lookup credentials for user (if username provided)
      let allowCredentials: any = undefined;
      if (input.username) {
        const user = await ctx.prisma.user.findFirst({ where: { username: input.username } });
        if (user) {
          const badge = await ctx.prisma.badgeDefinition.findUnique({ where: { slug: 'passkey' } });
          if (badge) {
            const creds = await ctx.prisma.badgeCredential.findMany({
              where: {
                userId: user.id,
                badgeId: badge.id,
                revokedAt: null,
              },
            });
            if (creds.length > 0) {
              allowCredentials = creds.map(c => {
                const meta = c.metadata as { credentialId?: string };
                return {
                  id: meta.credentialId,
                  type: 'public-key',
                  transports: ['internal'],
                };
              });
            }
          }
        }
      }
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: 'preferred',
        timeout: 60000,
        allowCredentials,
      });
      challengeStore.set(options.challenge, { username: input.username });
      return { ...options };
    }),

  finishLogin: publicProcedure
    .input(z.object({
      assertion: z.any(),
      challenge: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const expected = challengeStore.get(input.challenge);
      if (!expected) throw new Error('Invalid or expired challenge');
      // Lookup all passkey badge credentials for the user (by username if provided)
      let badgeCreds: any[] = [];
      if (expected.username) {
        const user = await ctx.prisma.user.findFirst({ where: { username: expected.username } });
        if (user) {
          const badge = await ctx.prisma.badgeDefinition.findUnique({ where: { slug: 'passkey' } });
          if (badge) {
            badgeCreds = await ctx.prisma.badgeCredential.findMany({
              where: {
                userId: user.id,
                badgeId: badge.id,
                revokedAt: null,
              },
            });
          }
        }
      } else {
        // If no username, try to find by credentialId
        const badge = await ctx.prisma.badgeDefinition.findUnique({ where: { slug: 'passkey' } });
        if (badge) {
          badgeCreds = await ctx.prisma.badgeCredential.findMany({
            where: {
              badgeId: badge.id,
              revokedAt: null,
            },
          });
        }
      }
      // Find the matching credential by credentialId
      const credentialId = input.assertion.id;
      let cred: typeof badgeCreds[number] | undefined;
      let meta: { credentialId?: string; publicKey?: string; counter?: number } = {};
      for (const c of badgeCreds) {
        if (isCredentialMeta(c.metadata)) {
          const metaTyped = c.metadata as { credentialId: string; publicKey?: string; counter?: number };
          // @ts-ignore
          if (metaTyped.credentialId === credentialId) {
            cred = c;
            meta = metaTyped;
            break;
          }
        }
      }
      if (!cred) throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
      const storedCounter = meta.counter || 0;
      // Verify assertion
      const verification = await verifyAuthenticationResponse({
        response: input.assertion,
        expectedChallenge: input.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: credentialId,
          publicKey: Buffer.from(meta.publicKey || '', 'base64url'),
          counter: storedCounter,
        },
      });
      if (!verification.verified) throw new Error('Authentication failed');
      // Check new counter for replay protection
      const newCounter = verification.authenticationInfo?.newCounter;
      if (typeof newCounter === 'number' && newCounter <= storedCounter) {
        throw new Error('Replay detected: counter did not increase');
      }
      // Update counter in metadata
      await ctx.prisma.badgeCredential.update({
        where: { id: cred.id },
        data: { metadata: { ...meta, counter: newCounter } },
      });
      challengeStore.delete(input.challenge);
      return { success: true, userId: cred.userId };
    }),
}); 