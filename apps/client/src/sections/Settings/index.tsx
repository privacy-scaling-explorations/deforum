import { PageContent } from "@/components/PageContent"
import { Banner } from "@/components/ui/Banner"
import { Avatar } from "./_Avatar"
import { BasicInfo } from "./_BasicInfo"
import { OpenSession } from "./_OpenSession"
import { Passkeys } from "./_Passkeys"
import { AuthWrapper } from "@/components/AuthWrapper"
import { Switch } from "@/components/inputs/Switch"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/Button"
import { trpc } from "@/lib/trpc"
import { generateAndRegisterKeys } from "@/lib/keys"
import { useState } from "react"

export const SettingsPage = () => {
  const { isDarkMode, setIsDarkMode, user } = useGlobalContext()
  const { t } = useTranslation()
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false)
  const addPublicKeyMutation = trpc.users.addPublicKey.useMutation()

  const handleGenerateNewKeys = async () => {
    if (!user?.id) return
    setIsGeneratingKeys(true)
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Key generation timed out')), 30000)
      )
      await Promise.race([
        generateAndRegisterKeys(addPublicKeyMutation, user.id),
        timeoutPromise
      ])
    } catch (error) {
      console.error('Error generating keys:', error)
    } finally {
      setIsGeneratingKeys(false)
    }
  }

  return (
    <PageContent title={t('pages.settings.title')}>
      <AuthWrapper className="flex flex-col gap-6">
        <Banner.Base className="text-center">
          <Banner.Label size="sm">
            {t('pages.settings.complete_profile')}
          </Banner.Label>
        </Banner.Base>
        <Avatar />
        <BasicInfo />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OpenSession />
          <Passkeys />
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Key Management</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Generate new keys for signing posts and replies. A backup file will be downloaded automatically.
          </p>
          <Button
            onClick={handleGenerateNewKeys}
            loading={isGeneratingKeys}
            disabled={isGeneratingKeys}
            variant='destructive'
          >
            Generate New Keys
          </Button>
        </div>
      </AuthWrapper>
      <div className="max-w-[200px]">
        <Switch
          label={t('pages.settings.dark_mode')}
          className="my-6"
          checked={isDarkMode}
          onChange={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    </PageContent>
  )
}
