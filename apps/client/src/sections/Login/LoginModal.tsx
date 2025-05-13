import { Button } from "@/components/ui/Button"
import { Modal, ModalProps } from "@/components/ui/Modal"
import { Link, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { trpc } from "@/lib/trpc"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/inputs/Input"
import { generateAndRegisterKeys } from "@/lib/keys"

function bufferDecode(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))
}

function bufferEncode(value: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export const LoginModal = ({ isOpen, setIsOpen }: ModalProps) => {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const [showPasskeySignupOptions, setShowPasskeyOptions] = useState(false)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [debouncedUsername, setDebouncedUsername] = useState("")

  // Auth Flow Mutations
  const generateAuthOptions = trpc.auth.generateAuthenticationOptions.useMutation()
  const generateRegistrationOptions = trpc.auth.generateRegistrationOptions.useMutation()
  const checkUsername = trpc.auth.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 }
  )

  // Debounce username changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username)
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  // Handle username availability check
  useEffect(() => {
    if (debouncedUsername.length >= 3) {
      if (checkUsername.data && !checkUsername.data.available) {
        setUsernameError(t('login.usernameTaken', 'Username "{{username}}" is already taken', { username: debouncedUsername }))
      } else {
        setUsernameError(null)
      }
    } else {
      setUsernameError(null)
    }
  }, [checkUsername.data, debouncedUsername, t])

  // Check for passkeys when modal opens
  useEffect(() => {
    if (isOpen) {
      handlePasskeyLogin()
    }
  }, [isOpen])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value
    setUsername(newUsername)
    if (newUsername.length < 3) {
      setUsernameError(null)
    }
  }

  const handlePasskeyLogin = async () => {
    setPasskeyError(null)
    setShowPasskeyOptions(false)
    setLoading(true)
    try {
      // Phase 1: Initial Discovery Attempt
      const options = await generateAuthOptions.mutateAsync()

      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        ...options,
        challenge: bufferDecode(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred) => ({
          ...cred,
          id: bufferDecode(cred.id),
          type: 'public-key',
          transports: ['internal']
        }))
      }

      let assertion
      try {
        assertion = await navigator.credentials.get({ publicKey: publicKeyOptions }) as PublicKeyCredential
      } catch (e) {
        setShowPasskeyOptions(true)
        setLoading(false)
        return
      }

      if (!assertion) {
        setShowPasskeyOptions(true)
        setLoading(false)
        return
      }

      // Phase 2: Verify Authentication Response
      const finishData = await signIn.mutateAsync({
        credentialId: assertion.id,
        response: {
          clientDataJSON: bufferEncode((assertion.response as AuthenticatorAssertionResponse).clientDataJSON),
          authenticatorData: bufferEncode((assertion.response as AuthenticatorAssertionResponse).authenticatorData),
          signature: bufferEncode((assertion.response as AuthenticatorAssertionResponse).signature),
          userHandle: (assertion.response as AuthenticatorAssertionResponse).userHandle ?
            bufferEncode((assertion.response as AuthenticatorAssertionResponse).userHandle!) : undefined
        }
      })

      if (finishData) {
        setIsOpen(false)
      }
    } catch (e: any) {
      console.error('Passkey login error:', e)
      if (e.message === 'UNREGISTERED_PASSKEY') {
        setShowPasskeyOptions(true)
        setPasskeyError(t('login.passkeyNotFound', 'Passkey not found. Create a new account?'))
      } else {
        setPasskeyError(e.message || t('login.passkeyLoginFailed', 'Passkey login failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!username) {
      setUsernameError(t('login.usernameRequired', 'Please choose a username'))
      return
    }
    if (usernameError) {
      return
    }

    setPasskeyError(null)
    setLoading(true)
    try {
      // 1. Request registration options from the server, sending the desired username.
      const registrationOptions = await generateRegistrationOptions.mutateAsync({ username })

      // 2. Initiate Passkey creation using the WebAuthn API with options from the server.
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        ...registrationOptions,
        challenge: bufferDecode(registrationOptions.challenge),
        rp: { // Best practice: RP ID should be the origin without scheme and port
          name: 'Deforum', // Use server-provided name or a default
          id: window.location.hostname // Always use window.location.hostname for RP ID
        },
        pubKeyCredParams: [ // This is in order of preference that we support on the server
          { alg: -8, type: 'public-key' }, // RS256 - Ed25519 - most preferred
          { alg: -7, type: 'public-key' },  // ES256 - ECDSA with SHA-256 - most common
          { alg: -50, type: 'public-key' }, // ML-DSA-87 - Quantum resistant future preferred
          { alg: -257, type: 'public-key' }, // RS256 - RSASSA-PKCS1-v1_5 using SHA-256 - fallback
        ],
        user: {
          id: bufferDecode(registrationOptions.user.id),
          name: registrationOptions.user.name,
          displayName: registrationOptions.user.displayName
        },
        excludeCredentials: registrationOptions.excludeCredentials?.map((cred: { id: string; type: string; transports?: string[] }) => ({
          type: 'public-key',
          id: bufferDecode(cred.id),
          transports: ['internal'] as AuthenticatorTransport[]
        })),
        authenticatorSelection: {
          // Require a resident key (discoverable credential)
          residentKey: 'required',
          requireResidentKey: true, // Deprecated but good for compatibility
          userVerification: 'preferred' // Preferred is usually better UX, `required` is stronger security
        }
      }

      // 3. Initiate Passkey creation using the WebAuthn API with options from the server.
      const credential = await navigator.credentials.create({ publicKey: publicKeyOptions }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Passkey creation cancelled or failed.')
      }

      // 4. Get the attestation response data.
      const attestationResponse = credential.response as AuthenticatorAttestationResponse

      // 5. Prepare data to send back to the server for verification and completion.
      const finishDataPayload = {
        username,
        credentialId: credential.id,
        response: {
          clientDataJSON: bufferEncode(attestationResponse.clientDataJSON),
          attestationObject: bufferEncode(attestationResponse.attestationObject),
          userHandle: null
        }
      }

      // 6. Send the Passkey credential response to the server to complete registration.
      const finishData = await signUp.mutateAsync({
        username,
        credentialId: credential.id,
        response: {
          clientDataJSON: bufferEncode(attestationResponse.clientDataJSON),
          attestationObject: bufferEncode(attestationResponse.attestationObject),
          userHandle: null
        }
      })

      // 7. Handle server response (e.g., JWT received on successful registration/login)
      if (finishData) {
        // Save JWT token to local storage
        localStorage.setItem('token', finishData.token)
        console.log('Registration successful!', finishData)
        setIsOpen(false)
        window.location.href = '/settings'
      }

      // 8. Generate EdDSA BabyJubjub keys and register them to the user account
      if (finishData?.user?.id) {
        const addPublicKey = trpc.users.addPublicKey.useMutation()
        await generateAndRegisterKeys(addPublicKey, finishData.user.id)
      }

    } catch (e: any) {
      // Handle errors from tRPC calls or navigator.credentials.create
      console.error('Passkey registration failed:', e)
      // Provide more specific error messages based on the error type or content if possible
      if (e.message.includes('cancelled')) {
        setPasskeyError(t('login.passkeyCreationCancelled', 'Passkey creation was cancelled.'))
      } else {
        setPasskeyError(e.message || t('login.registrationFailed', 'Registration failed. Please try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={t('login.title', 'Login')} isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-2">
          {!showPasskeySignupOptions && (
            <Button onClick={handlePasskeyLogin} loading={loading}>
              {t('login.continueWithPasskey', 'Continue with Passkey')}
            </Button>
          )}
          {showPasskeySignupOptions && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Input
                  placeholder={t('login.usernamePlaceholder', 'Enter your username')}
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={loading}
                />
                {usernameError && (
                  <span className="text-error text-sm">{usernameError}</span>
                )}
              </div>
              <Button
                onClick={handleCreateAccount}
                loading={loading}
                disabled={!!usernameError || !username || username.length < 3}
              >
                {t('login.createNewAccount', 'Create New Account')}
              </Button>
            </div>
          )}
          {passkeyError && (
            <span className="text-error text-sm">{passkeyError}</span>
          )}
        </div>
      </div>
    </Modal>
  )
};

