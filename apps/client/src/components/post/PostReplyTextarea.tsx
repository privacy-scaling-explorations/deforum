import { Button } from "../ui/Button"
import { Textarea } from "../inputs/Textarea"
import { Select } from "../inputs/Select"
import { Switch } from "../inputs/Switch"
import { useForm } from "@tanstack/react-form"
import { MailIcon, FileBadge } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Tag } from "../ui/Tag"
import { useGetAllBadges } from "@/hooks/useBadges"
import { PostAuthor } from "@/shared/schemas/post"
import { useTranslation } from 'react-i18next'

interface PostReplyFormData {
  tags: string[]
  postAsAnonymous: boolean
  content: string
}

interface PostReplyProps {
  postId?: number | string
  author?: PostAuthor
  onFocus?: () => void
  isVisible?: boolean
  showFields?: boolean
  placeholder?: string
  rows?: number
  onClick?: () => void
  onBlur?: () => void
}

export const PostReplyTextarea = ({
  author,
  isVisible = false,
  showFields = false,
  placeholder = "Add comment",
  rows = 4,
  onClick,
  onFocus,
  onBlur,
}: PostReplyProps) => {
  if (!isVisible) return null

  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const form = useForm<PostReplyFormData, any, any, any, any, any, any, any, any, any>()
  const { t } = useTranslation()

  const { data: badges } = useGetAllBadges()

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      className={cn({
        "flex flex-col gap-4 border-l-[3px] border-base-border pl-5":
          showFields,
      })}
      onFocus={onFocus}
    >
      <Textarea
        placeholder={placeholder}
        rows={rows}
        onClick={onClick}
        onBlur={onBlur}
      />

      {showFields && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between">
            <div className="lg:w-1/4">
              {/* <form.Field
                name="tags"
                children={(field) => (
                  <Select
                    header={
                      <div className="flex items-center gap-[6px] text-base-muted-foreground">
                        <FileBadge className="size-[18px]" />
                        <span className="text-base font-medium">{t('pages.post.create.badges')}</span>
                      </div>
                    }
                    label={t('pages.post.create.add_badges')}
                    items={badges?.map(({ id, name }: any) => ({
                      value: id,
                      label: (
                        <div className="flex items-center gap-1">
                          <MailIcon className="size-4" />
                          <span>{name}</span>
                        </div>
                      ),
                    })) || []}
                    onValueChange={(value) => {
                      const currentTags = field.state.value || []
                      if (!currentTags.includes(value)) {
                        setSelectedBadges([...currentTags, value])
                      }
                    }}
                    field={field}
                  />
                )}
              /> */}
            </div>
            <div className="ml-auto flex flex-col gap-4 justify-end" onClick={handleButtonClick}>
              <form.Field
                name="postAsAnonymous"
                children={(field) => (
                  <Switch
                    disabled
                    label={t('pages.post.create.anonymous.label')}
                    description={
                      field.state.value
                        ? t('pages.post.create.anonymous.description_on')
                        : t('pages.post.create.anonymous.description_off', { username: author?.username })
                    }
                    checked={!!field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    field={field}
                  />
                )}
              />
              <form.Subscribe
                selector={({ canSubmit, isSubmitting }) => [
                  canSubmit,
                  isSubmitting,
                ]}
                children={([_canSubmit, isSubmitting]) => (
                  <Button
                    aria-busy={isSubmitting}
                    disabled={isSubmitting}
                    className="min-w-[160px]"
                  >
                    {t('actions.post')}
                  </Button>
                )}
              />
            </div>
          </div>
          {/* {selectedBadges && selectedBadges.length > 0 && (
            <div className="flex flex-col gap-2">
              {selectedBadges.map((badge: any) => {
                const badgeData = badges?.find((b: any) => b.id === badge)
                return (
                  <Tag key={badge} className="w-fit">
                    <MailIcon className="size-4" />
                    <span>{badgeData?.name}</span>
                  </Tag>
                )
              })}
            </div>
          )} */}
        </div>
      )}
    </div>
  )
}
