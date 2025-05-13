import { Button } from "@/components/ui/Button"
import { Card } from "@/components/cards/Card"
import { classed } from "@tw-classed/react"
import { useTranslation } from 'react-i18next'
import { trpc } from "@/lib/trpc"
import { useEffect, useState } from "react"
import { format } from "date-fns"

const PasskeyTableWrapper = classed.div(
  "h-10 flex items-center lg:grid lg:grid-cols-[1fr_150px_90px] gap-2",
)

interface Passkey {
  id: string
  credentialId: string
  lastUsedAt: string | null
  createdAt: string
}

export function Passkeys() {
  const { t } = useTranslation()
  const { data: passkeys, refetch } = trpc.users.getPasskeys.useQuery()
  const removePasskeyMutation = trpc.users.removePasskey.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const handleRemovePasskey = (passkeyId: string) => {
    if (window.confirm(t('settings.confirmRemovePasskey'))) {
      removePasskeyMutation.mutate({ passkeyId })
    }
  }

  return (
    <Card.Base className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Card.Title>{t('pages.settings.passkeys.title')}</Card.Title>
        <Card.Description>
          {t('pages.settings.passkeys.description')}
        </Card.Description>
      </div>
      <div className="flex flex-col">
        <PasskeyTableWrapper className="border-b border-base-border">
          <span className="text-sm font-medium text-base-muted-foreground">
            {t('pages.settings.passkeys.headers.credential')}
          </span>
          <span className="text-sm font-medium text-base-muted-foreground">
            {t('pages.settings.passkeys.headers.last_used')}
          </span>
          <span></span>
        </PasskeyTableWrapper>
        {passkeys?.map((passkey) => (
          <PasskeyTableWrapper
            key={passkey.id}
            className="border-b border-base-border h-[52px]"
          >
            <span className="text-sm text-base-foreground font-medium">
              {passkey.credentialId.slice(0, 8)}...
            </span>
            <span className="text-sm text-base-foreground">
              {passkey.lastUsedAt ? format(new Date(passkey.lastUsedAt), 'PPp') : t('pages.settings.passkeys.never_used')}
            </span>
            <div>
              <Button
                variant="outline"
                className="!flex !w-full"
                onClick={() => handleRemovePasskey(passkey.id)}
              >
                {t('actions.remove')}
              </Button>
            </div>
          </PasskeyTableWrapper>
        ))}
        {(!passkeys || passkeys.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400">{t('settings.noPasskeys')}</p>
        )}
      </div>
    </Card.Base>
  )
}