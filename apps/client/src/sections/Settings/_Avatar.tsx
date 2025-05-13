import { Card } from "@/components/cards/Card"
import { FileUploader } from "@/components/inputs/FileUploader"
import { useTranslation } from 'react-i18next'
import { trpc } from "@/lib/trpc"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"

export const Avatar = () => {
  const { t } = useTranslation()
  const [avatar, setAvatar] = useState<string | null>(null)
  const { data: user } = trpc.users.me.useQuery()
  const uploadAvatarMutation = trpc.users.uploadAvatar.useMutation()
  const removeAvatarMutation = trpc.users.removeAvatar.useMutation()

  useEffect(() => {
    if (user?.avatar) {
      setAvatar(user.avatar)
    }
  }, [user?.avatar])

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadAvatarMutation.mutateAsync({ file })
      if (result.avatar) {
        setAvatar(result.avatar)
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatarMutation.mutateAsync()
      setAvatar(null)
    } catch (error) {
      console.error('Failed to remove avatar:', error)
    }
  }

  return (
    <Card.Base className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Card.Title>{t('pages.settings.avatar.title')}</Card.Title>
        <Card.Description>
          {t('pages.settings.avatar.description')}
        </Card.Description>
      </div>
      <div className="flex flex-col items-center gap-4">
        <img
          src={avatar || undefined}
          alt={user?.username || 'User avatar'}
          className="w-24 h-24"
        />
        <div className="flex gap-2">
          <FileUploader
            onFileSelect={handleFileUpload}
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
          />
          {avatar && (
            <Button
              variant="outline"
              onClick={handleRemoveAvatar}
            >
              {t('actions.remove')}
            </Button>
          )}
        </div>
      </div>
    </Card.Base>
  )
}
