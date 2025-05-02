import { Button } from "@/components/ui/Button";
import { Modal, ModalProps } from "@/components/ui/Modal";
import { Link } from "@tanstack/react-router";
import { useSignIn } from "@/hooks/useAuth";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";

function bufferDecode(value: string) {
  // base64url decode
  value = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function bufferEncode(value: ArrayBuffer) {
  // base64url encode
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const LoginModal = ({ isOpen, setIsOpen }: ModalProps) => {
  const { t } = useTranslation();
  const loginMutation = useSignIn();
  const [showPasskeyOptions, setShowPasskeyOptions] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Passkey Login Flow
  const beginLogin = trpc.passkey.beginLogin.useMutation();
  const finishLogin = trpc.passkey.finishLogin.useMutation();
  const beginRegistration = trpc.passkey.beginRegistration.useMutation();
  const finishRegistration = trpc.passkey.finishRegistration.useMutation();

  const handlePasskeyLogin = async () => {
    setPasskeyError(null);
    setShowPasskeyOptions(false);
    setLoading(true);
    try {
      // 1. Begin login (get challenge)
      const options = await beginLogin.mutateAsync({});
      // Fix: ensure challenge is BufferSource
      const publicKeyOptions: PublicKeyCredentialRequestOptions = {
        ...options,
        challenge: bufferDecode(options.challenge),
        allowCredentials: options.allowCredentials?.map((cred: any) => ({
          ...cred,
          id: bufferDecode(cred.id),
        })),
      };
      let assertion;
      try {
        assertion = await navigator.credentials.get({ publicKey: publicKeyOptions }) as PublicKeyCredential;
      } catch (e) {
        setShowPasskeyOptions(true);
        setLoading(false);
        return;
      }
      if (!assertion) {
        setShowPasskeyOptions(true);
        setLoading(false);
        return;
      }
      // 3. Send assertion to backend
      const finishData = await finishLogin.mutateAsync({
        assertion: {
          id: assertion.id,
          rawId: bufferEncode(assertion.rawId),
          response: {
            authenticatorData: bufferEncode((assertion.response as AuthenticatorAssertionResponse).authenticatorData),
            clientDataJSON: bufferEncode((assertion.response as AuthenticatorAssertionResponse).clientDataJSON),
            signature: bufferEncode((assertion.response as AuthenticatorAssertionResponse).signature),
            userHandle: (assertion.response as AuthenticatorAssertionResponse).userHandle ? bufferEncode((assertion.response as AuthenticatorAssertionResponse).userHandle!) : null,
          },
          type: assertion.type,
          clientExtensionResults: assertion.getClientExtensionResults(),
        },
        challenge: options.challenge,
      });
      if (finishData?.success) {
        setIsOpen(false);
      } else {
        setShowPasskeyOptions(true);
        setPasskeyError(t('login.passkeyNotFound', 'Passkey not found. Create a new account?'));
      }
    } catch (e: any) {
      setPasskeyError(e.message || t('login.passkeyLoginFailed', 'Passkey login failed'));
      setShowPasskeyOptions(true);
    } finally {
      setLoading(false);
    }
  };

  // Passkey Registration Flow
  const handleCreateAccount = async () => {
    setPasskeyError(null);
    setLoading(true);
    try {
      // 1. Begin registration (get challenge)
      const options = await beginRegistration.mutateAsync({});
      // Fix: ensure challenge and user.id are BufferSource
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: bufferDecode(options.challenge),
        user: {
          ...options.user,
          id: bufferDecode(options.user.id),
        },
        excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
          ...cred,
          id: bufferDecode(cred.id),
        })),
      };
      // 2. navigator.credentials.create
      let attestation;
      try {
        attestation = await navigator.credentials.create({ publicKey: publicKeyOptions }) as PublicKeyCredential;
      } catch (e) {
        setPasskeyError(t('login.registrationCancelled', 'Registration cancelled or failed'));
        setLoading(false);
        return;
      }
      if (!attestation) {
        setPasskeyError(t('login.registrationFailed', 'Registration failed'));
        setLoading(false);
        return;
      }
      // 3. Send attestation to backend
      const finishData = await finishRegistration.mutateAsync({
        attestation: {
          id: attestation.id,
          rawId: bufferEncode(attestation.rawId),
          response: {
            attestationObject: bufferEncode((attestation.response as AuthenticatorAttestationResponse).attestationObject),
            clientDataJSON: bufferEncode((attestation.response as AuthenticatorAttestationResponse).clientDataJSON),
          },
          type: attestation.type,
          clientExtensionResults: attestation.getClientExtensionResults(),
        },
        challenge: options.challenge,
      });
      if (finishData?.success) {
        setIsOpen(false);
      } else {
        setPasskeyError(t('login.registrationFailed', 'Registration failed'));
      }
    } catch (e: any) {
      setPasskeyError(e.message || t('login.registrationFailed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('login.title', 'Login')} isOpen={isOpen} setIsOpen={setIsOpen}>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-1">
          <span className="text-base-muted-foreground leading-5 text-sm font-bold">
            {t('login.privateGoogleSignIn', 'Private Google Sign In')}
          </span>
          <span className="text-base-muted-foreground text-sm leading-5">
            {t('login.privateGoogleSignInDesc', "We'll use Stealth.notes protocol as a way to log in and prove your email domain ownership in private way without our server knowing who you are.")}
            <Link className="text-link block" to="#">
              {t('login.readMore', 'Read more here')}
            </Link>
          </span>
        </div>
        <Button
          onClick={() => loginMutation.mutateAsync()}
          loading={loginMutation.isPending}
        >
          {t('login.signInWithGoogle', 'Sign in with Google')}
        </Button>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={handlePasskeyLogin} loading={loading}>
            {t('login.signInWithPasskey', 'Sign in with Passkey')}
          </Button>
          {showPasskeyOptions && (
            <div className="flex flex-col gap-2 mt-2">
              <Button onClick={handleCreateAccount} loading={loading}>
                {t('login.createNewAccountWithPasskey', 'Create New Account with Passkey')}
              </Button>
              <Button disabled variant="outline">
                {t('login.recoverOldAccount', 'Recover Old Account (coming soon)')}
              </Button>
            </div>
          )}
          {passkeyError && (
            <span className="text-error text-sm">{passkeyError}</span>
          )}
        </div>
      </div>
    </Modal>
  );
};

