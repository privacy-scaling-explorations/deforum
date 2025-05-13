import { Card } from "@/components/cards/Card"
import { Input } from "@/components/inputs/Input"
import { Select } from "@/components/inputs/Select"
import { Textarea } from "@/components/inputs/Textarea"
import { Button } from "@/components/ui/Button"
import { useTranslation } from 'react-i18next'
import { trpc } from "@/lib/trpc"
import { useEffect, useState } from "react"

interface UserProfile {
  username: string
  website?: string
  bio?: string
}

export const BasicInfo = () => {
  const { t, i18n } = useTranslation()
  const { data: user } = trpc.users.me.useQuery()
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    website: '',
    bio: ''
  })
  const [usernameError, setUsernameError] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)

  const updateProfileMutation = trpc.users.updateProfile.useMutation()

  const { data: usernameAvailable } = trpc.auth.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 && debouncedUsername !== user?.username }
  )

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        username: user.username,
        website: user.website || '',
        bio: user.bio || ''
      }))
    }
  }, [user, i18n.language])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(profile.username)
    }, 500)
    return () => clearTimeout(timer)
  }, [profile.username])

  useEffect(() => {
    if (usernameAvailable) {
      setIsUsernameAvailable(usernameAvailable.available)
      setIsCheckingUsername(false)
    }
  }, [usernameAvailable])

  useEffect(() => {
    if (usernameAvailable !== undefined) {
      if (!usernameAvailable.available) {
        setUsernameError(t('pages.settings.basic_info.username.taken'))
      } else {
        setUsernameError(undefined)
      }
    }
  }, [usernameAvailable, t])

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    setProfile(prev => ({ ...prev, language: value }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))

    if (name === 'username') {
      setDebouncedUsername(value)
    }
  }

  const handleSave = async () => {
    if (usernameError) return

    setIsSaving(true)
    try {
      await updateProfileMutation.mutateAsync({
        id: user!.id,
        data: {
          username: profile.username,
          website: profile.website,
          bio: profile.bio
        }
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card.Base className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Card.Title>{t('pages.settings.basic_info.title')}</Card.Title>
        <Card.Description>
          {t('pages.settings.basic_info.description')}
        </Card.Description>
      </div>
      <div className="flex flex-col gap-4 lg:grid-cols-2 lg:grid">
        <Input
          label={t('pages.settings.basic_info.username.label')}
          placeholder={t('pages.settings.basic_info.username.placeholder')}
          value={profile.username}
          onChange={handleInputChange}
          error={usernameError}
        />
        <Input
          label={t('pages.settings.basic_info.website.label')}
          placeholder={t('pages.settings.basic_info.website.placeholder')}
          value={profile.website}
          onChange={handleInputChange}
        />
        <Textarea
          containerClassName="lg:col-span-2"
          label={t('pages.settings.basic_info.bio.label')}
          placeholder={t('pages.settings.basic_info.bio.placeholder')}
          value={profile.bio}
          onChange={handleInputChange}
        />
      </div>
      <div className="py-4 flex justify-end">
        <Button
          onClick={handleSave}
          loading={isSaving}
          disabled={!!usernameError || !isUsernameAvailable}
        >
          {isSaving ? t('actions.saving') : t('actions.save')}
        </Button>
      </div>
    </Card.Base>
  )
}
