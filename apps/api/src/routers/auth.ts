import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router, protectedProcedure } from '../lib/trpc';
import { prisma } from '../lib/db';
import { createJWT, verifyJWT } from '../lib/jwt';
import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  generateRegistrationOptions,
  generateAuthenticationOptions
} from '@simplewebauthn/server';
import { addDays } from 'date-fns';
import crypto from 'crypto';
import { AuthenticatorTransport } from '@simplewebauthn/server';

const RP_NAME = 'Deforum';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

// Helper function for generating registration options
async function generateWebAuthnRegistrationOptions({
  rpName,
  rpID,
  userID,
  userName,
  excludeCredentials = []
}: {
  rpName: string;
  rpID: string;
  userID: Buffer;
  userName: string;
  excludeCredentials?: Array<{ id: string; type: string; transports?: AuthenticatorTransport[] }>;
}) {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID,
    userName,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'preferred'
    },
    excludeCredentials: excludeCredentials.map((cred) => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports
    }))
  });

  // Store challenge
  await prisma.webAuthnChallenge.create({
    data: {
      challenge: options.challenge,
      expiresAt: addDays(new Date(), 1)
    }
  });

  return options;
}

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  checkUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findFirst({
        where: {
          username: {
            equals: input.username,
            mode: 'insensitive'
          }
        }
      });
      return { available: !user };
    }),

  // Phase 1: Initial Discovery Attempt
  generateAuthenticationOptions: publicProcedure.mutation(async () => {
    // Generate authentication options for discovery
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [], // Empty array signals browser to discover any available passkeys
      userVerification: 'preferred',
      timeout: 60000 // 1 minute timeout
    });

    // Store challenge in database for later verification
    await prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        expiresAt: addDays(new Date(), 1)
      }
    });

    return options;
  }),

  // Phase 2: Verify Authentication Response
  verifyAuthentication: publicProcedure
    .input(
      z.object({
        credentialId: z.string(),
        response: z.object({
          clientDataJSON: z.string(),
          authenticatorData: z.string(),
          signature: z.string(),
          userHandle: z.string().optional()
        })
      })
    )
    .mutation(async ({ input }) => {
      const { credentialId, response } = input;

      // Get stored challenge
      const challenge = await prisma.webAuthnChallenge.findFirst({
        where: {
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!challenge) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Challenge expired or not found'
        });
      }

      // Find passkey credential
      const passkeyCredential = await prisma.passkey.findFirst({
        where: {
          credentialId
        },
        include: { user: true }
      });

      if (!passkeyCredential) {
        // Unregistered passkey - return specific error
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'UNREGISTERED_PASSKEY',
          cause: {
            credentialId,
            response
          }
        });
      }

      // Verify authentication response
      const verification = await verifyAuthenticationResponse({
        response: {
          id: credentialId,
          rawId: credentialId,
          response,
          type: 'public-key',
          clientExtensionResults: {}
        },
        expectedChallenge: challenge.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: passkeyCredential.credentialId,
          publicKey: Buffer.from(passkeyCredential.publicKey, 'base64'),
          counter: passkeyCredential.counter
        }
      });

      if (!verification.verified) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Authentication verification failed'
        });
      }

      // Update counter
      await prisma.passkey.update({
        where: { id: passkeyCredential.id },
        data: {
          counter: verification.authenticationInfo.newCounter,
          lastUsedAt: new Date()
        }
      });

      // Create JWT
      const token = await createJWT({
        userId: passkeyCredential.user.id,
        username: passkeyCredential.user.username,
        passkeyId: passkeyCredential.id
      });

      // Clean up challenge
      await prisma.webAuthnChallenge.delete({
        where: { id: challenge.id }
      });

      return {
        token,
        user: passkeyCredential.user
      };
    }),

  // Phase 3: Login with Username
  generateAuthenticationOptionsWithUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input }) => {
      const { username } = input;

      // Find user and their passkeys
      const user = await prisma.user.findFirst({
        where: { username },
        include: { passkeys: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Generate authentication options
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: user.passkeys.map((passkey) => ({
          id: passkey.credentialId,
          type: 'public-key',
          transports: ['internal']
        })),
        userVerification: 'preferred',
        timeout: 60000
      });

      // Store challenge with user ID
      await prisma.webAuthnChallenge.create({
        data: {
          challenge: options.challenge,
          userId: user.id,
          expiresAt: addDays(new Date(), 1)
        }
      });

      return options;
    }),

  // Phase 4: Handle Unregistered Passkey
  initiateRegistrationFromUnregisteredPasskey: publicProcedure
    .input(
      z.object({
        username: z.string(),
        credentialId: z.string(),
        response: z.object({
          clientDataJSON: z.string(),
          attestationObject: z.string(),
          userHandle: z.string().nullable().optional()
        })
      })
    )
    .mutation(async ({ input }) => {
      const { username, credentialId, response } = input;

      // Check if username is taken
      const existingUser = await prisma.user.findFirst({
        where: { username }
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken'
        });
      }

      // Get stored challenge from initial login attempt
      const challenge = await prisma.webAuthnChallenge.findFirst({
        where: {
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!challenge) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Challenge expired or not found'
        });
      }

      // Verify registration response
      const verification = await verifyRegistrationResponse({
        response: {
          id: credentialId,
          rawId: credentialId,
          response: {
            clientDataJSON: response.clientDataJSON,
            attestationObject: response.attestationObject
          },
          type: 'public-key',
          clientExtensionResults: {}
        },
        expectedChallenge: challenge.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true
      });

      if (!verification.verified || !verification.registrationInfo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Registration verification failed'
        });
      }

      // Create new user
      const user = await prisma.user.create({
        data: {
          username,
          passkeys: {
            create: {
              credentialId,
              publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString(
                'base64'
              ),
              counter: verification.registrationInfo.credential.counter
            }
          }
        },
        include: {
          passkeys: true
        }
      });

      // Create JWT
      const token = await createJWT({
        userId: user.id,
        username: user.username,
        passkeyId: user.passkeys[0].id
      });

      // Clean up challenge
      await prisma.webAuthnChallenge.delete({
        where: { id: challenge.id }
      });

      return {
        token,
        user
      };
    }),

  // Phase 4: Generate Registration Options
  generateRegistrationOptions: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input }) => {
      const { username } = input;

      // Check if username is taken
      const existingUser = await prisma.user.findFirst({
        where: { username }
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already taken'
        });
      }

      return generateWebAuthnRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: Buffer.from(crypto.randomUUID()),
        userName: username
      });
    }),

  // Phase 4: Add Passkey to Existing Account
  generateAddPasskeyOptions: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      // Verify JWT
      const payload = await verifyJWT(token);
      if (!payload.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        });
      }

      // Get user and their passkeys
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { passkeys: true }
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      return generateWebAuthnRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: Buffer.from(user.id),
        userName: user.username,
        excludeCredentials: user.passkeys.map((passkey) => ({
          id: passkey.credentialId,
          type: 'public-key',
          transports: ['internal']
        }))
      });
    }),

  // Phase 4: Complete Adding Passkey
  addPasskeyToAccount: publicProcedure
    .input(
      z.object({
        token: z.string(),
        credential: z.object({
          id: z.string(),
          rawId: z.string(),
          response: z.object({
            clientDataJSON: z.string(),
            attestationObject: z.string()
          }),
          type: z.literal('public-key'),
          clientExtensionResults: z.record(z.any()).optional()
        })
      })
    )
    .mutation(async ({ input }) => {
      const { token, credential } = input;

      // Verify JWT
      const payload = await verifyJWT(token);
      if (!payload.userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        });
      }

      // Get stored challenge
      const challenge = await prisma.webAuthnChallenge.findFirst({
        where: {
          userId: payload.userId,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!challenge) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Challenge expired or not found'
        });
      }

      // Verify registration response
      const verification = await verifyRegistrationResponse({
        response: {
          ...credential,
          clientExtensionResults: credential.clientExtensionResults || {}
        },
        expectedChallenge: challenge.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true
      });

      if (!verification.verified || !verification.registrationInfo) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Registration verification failed'
        });
      }

      // Create new passkey
      await prisma.passkey.create({
        data: {
          userId: payload.userId,
          credentialId: credential.id,
          publicKey: Buffer.from(verification.registrationInfo.credential.publicKey).toString(
            'base64'
          ),
          counter: verification.registrationInfo.credential.counter
        }
      });

      // Clean up challenge
      await prisma.webAuthnChallenge.delete({
        where: { id: challenge.id }
      });

      return { success: true };
    })
});
