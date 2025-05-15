import { z } from 'zod';

export const PasskeySchema = z.object({
  id: z.string(),
  userId: z.string(),
  credentialId: z.string(),
  publicKey: z.string(),
  counter: z.number(),
  createdAt: z.string(),
  lastUsedAt: z.string().optional(),
  revokedAt: z.string().optional()
});

export type Passkey = z.infer<typeof PasskeySchema>;

export const BeginRegistrationResponseSchema = z.object({
  challenge: z.string(),
  rp: z.object({
    name: z.string(),
    id: z.string()
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string()
  }),
  pubKeyCredParams: z.array(
    z.object({
      type: z.literal('public-key'),
      alg: z.number()
    })
  ),
  timeout: z.number(),
  attestation: z.string(),
  authenticatorSelection: z.object({
    authenticatorAttachment: z.string(),
    residentKey: z.string(),
    requireResidentKey: z.boolean(),
    userVerification: z.string()
  }),
  excludeCredentials: z.array(
    z.object({
      id: z.string(),
      type: z.literal('public-key'),
      transports: z.array(z.string())
    })
  )
});

export const FinishRegistrationRequestSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    attestationObject: z.string()
  }),
  type: z.literal('public-key'),
  clientExtensionResults: z.record(z.any()).optional()
});

export const BeginLoginResponseSchema = z.object({
  challenge: z.string(),
  rpId: z.string(),
  allowCredentials: z.array(
    z.object({
      id: z.string(),
      type: z.literal('public-key'),
      transports: z.array(z.string())
    })
  ),
  userVerification: z.string(),
  timeout: z.number()
});

export const FinishLoginRequestSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  response: z.object({
    clientDataJSON: z.string(),
    authenticatorData: z.string(),
    signature: z.string(),
    userHandle: z.string().optional()
  }),
  type: z.literal('public-key'),
  clientExtensionResults: z.record(z.any()).optional()
});

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string()
  })
});

export const CheckUsernameSchema = z.object({
  username: z.string().min(3)
});

export type CheckUsername = z.infer<typeof CheckUsernameSchema>;
