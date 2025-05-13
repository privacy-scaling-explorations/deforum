import { Select } from "@/components/inputs/Select"
import { Input } from "@/components/inputs/Input"
import { Tabs } from "@/components/ui/Tabs"
import { useForm } from "@tanstack/react-form"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/Button"
import { useRouter, useSearch } from "@tanstack/react-router"
import { Textarea } from "@/components/inputs/Textarea"
import { PageContent } from "@/components/PageContent"
import {
  useCreateDraftMutation,
  useCreatePostMutation,
} from "@/hooks/usePosts"
import { useGetAllBadges } from "@/hooks/useBadges"
import { Card } from "@/components/cards/Card"
import { Switch } from "@/components/inputs/Switch"
import { useMemo, useCallback, useState } from "react"
import { useGetUser } from "@/hooks/useAuth"
import { capitalize } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { signPost } from '@/lib/sign'
import { SignatureMetadata } from '../../../../shared/dist/schemas/post'

enum TabName {
  Write = "write",
  Drafts = "drafts",
}

type SubmissionData = {
  author: {
    id: string | null
    username: string | null
    isAnon: boolean
    badges: string[]
  }
  type: string
  title: string
  content: string
  isAnon: boolean
  communityId: string | null | undefined
  signatureMetadata?: string
}

export const PostCreate = () => {
  const createDraftMutation = useCreateDraftMutation()
  const createPostMutation = useCreatePostMutation()
  const [selectedBadge, setSelectedBadge] = useState<string[] | undefined>([])
  const { data: user } = useGetUser()
  const { t } = useTranslation()

  const search = useSearch({ from: "/_left-sidebar/post/create" })
  const router = useRouter()

  const { data: badges = [] } = useGetAllBadges()

  const communityOptions = useMemo(() => {
    // Create an option for the user's personal page
    const personalPageOption = {
      value: "personal",
      label: t("pages.post.create.personal_page", "My Personal Page"),
    }

    // Add communities the user has joined
    const communityOptions = user?.communities?.map(([id, name]) => ({
      value: id,
      label: name,
    })) ?? []

    // Return with personal page as the first option
    return [personalPageOption, ...communityOptions]
  }, [user, t])

  const userBadges = useMemo(() => {
    return (
      user?.credentials?.map(({ id, name }: any) => ({
        value: id,
        label: name,
      })) ?? []
    )
  }, [user])

  const badgeMap = useMemo(() => {
    const map = new Map()
    if (badges) {
      badges.forEach((badge: any) => {
        map.set(badge.id, badge.name)
      })
    }
    return map
  }, [badges])

  const getBadgeName = useCallback(
    (badgeId: string) => {
      return badgeMap.get(badgeId) || "Unknown"
    },
    [badgeMap],
  )

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      author: {
        id: user?.id?.toString() || null,
        username: user?.username || null,
        isAnon: false,
        badges: userBadges,
      },
      isAnon: false,
      community: search?.community ? String(search.community) : undefined,
    },
    onSubmit: async ({ value }) => {
      let submissionData: SubmissionData
      if (!value.isAnon) {
        submissionData = {
          ...value,
          author: {
            id: user?.id?.toString() || null,
            username: user?.username || null,
            isAnon: value?.isAnon ?? false,
            badges: selectedBadge || [],
          },
          // Set communityId to null for personal page posts
          communityId: value.community === "personal" ? null : value.community,
          // Add the required type field
          type: value.community === "personal" ? "PROFILE" : "COMMUNITY",
        }

        if (submissionData.author.isAnon == false) {
          // Create a signature on the post data
          if (!value.community) {
            throw new Error("Can't create an anonymous post on your profile")
          }
          const signature = await signPost(submissionData)
          submissionData.signatureMetadata = signature.toString()
        }
      } else {
        // TODO! GENERATE SEMAPHORE PROOF
        submissionData = {
          title: value.title,
          content: value.content,
          proof: semaphoreProof
        }
      }

      try {
        const res = await createPostMutation.mutateAsync(submissionData as any)
        if (res.id) {
          router.navigate({ to: `/posts/${res.id}` })
        }
      } catch (err) {
        console.debug("Error creating post:", err)
      }
    },
    validators: {
      onChange: undefined
    },
  })

  // const handleAddTag = useCallback(
  //   (tagId: string) => {
  //     if (selectedBadge?.includes(tagId)) {
  //       setSelectedBadge((prev) => prev?.filter((id) => id !== tagId))
  //     } else {
  //       setSelectedBadge((prev) => [...(prev || []), tagId])
  //     }
  //   },
  //   [selectedBadge],
  // )

  // const handleRemoveTag = useCallback(
  //   (tagToRemove: string) => {
  //     form.setFieldValue("tags" as any, (prev: string[] | undefined) =>
  //       (prev || []).filter((tag: string) => tag !== tagToRemove),
  //     )
  //   },
  //   [form],
  // )

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form className="w-full h-full pb-6" onSubmit={handleSubmit}>
      <PageContent title={t("actions.new_post")} className="flex flex-col h-full">
        <Tabs
          defaultValue={TabName.Write}
          minWidth={170}
          items={[
            {
              id: TabName.Write,
              label: t("actions.new_post"),
            },
            {
              id: TabName.Drafts,
              label: t("pages.post.drafts", "Drafts"),
              onClick: () => {
                router.navigate({ to: "/post/drafts" })
              },
            },
          ]}
        />

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="lg:w-1/4 w-full">
              <form.Field
                name="community"
                children={(field) => (
                  <Select
                    label={t("pages.post.create.select_community")}
                    items={communityOptions}
                    onValueChange={(value) => field.handleChange(value)}
                    value={field.state.value || ""}
                    field={field}
                  />
                )}
              />
            </div>

            <form.Field
              name="title"
              children={(field) => (
                <Input
                  onChange={(e) => field.handleChange(e.target.value)}
                  maxLength={200}
                  placeholder={capitalize(field.name)}
                  value={field.state.value || ""}
                  field={field}
                  showCounter={false}
                />
              )}
            />

            <form.Field
              name="content"
              children={(field) => (
                <Textarea
                  id={field.name}
                  rows={4}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value || ""}
                  placeholder={t("pages.post.create.placeholder")}
                  field={field}
                />
              )}
            />
          </div>

          {/*
          // TODO Add the ability to add additional tags to your posts
          <div className="flex flex-col gap-6">
            <div className="lg:w-1/4 w-full">
              <Select
                header={
                  <div className="flex items-center gap-[6px] text-base-muted-foreground">
                    <FileBadge className="size-[18px]" />
                    <span className="text-base font-medium">Badges</span>
                  </div>
                }
                label="Add badges"
                items={userBadges}
                onValueChange={handleAddTag}
                value=""
              />
            </div>
            {(selectedBadge ?? [])?.length > 0 && (
              <div className="flex gap-2.5 flex-wrap">
                {(selectedBadge ?? []).map((tag) => (
                  <Tag key={tag} onRemove={() => handleRemoveTag(tag)}>
                    <MailIcon className="size-4" />
                    {getBadgeName(tag)}
                  </Tag>
                ))}
              </div>
            )}
          </div> */}
        </div>

        <Card.Base variant="secondary" className="mt-auto">
          <div className="flex justify-end gap-2.5">
            <form.Field
              name="isAnon"
              children={(field) => (
                <Switch
                  disabled
                  label={t("pages.post.create.anonymous.label")}
                  description={
                    field.state.value
                      ? t("pages.post.create.anonymous.description_on")
                      : t("pages.post.create.anonymous.description_off", { username: user?.username })
                  }
                  checked={field.state.value || false}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  field={field}
                />
              )}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                createDraftMutation.mutate({
                  content: form.state.values.content || "",
                  title: form.state.values.title || "",
                })
              }}
            >
              {t("actions.save_draft")}
            </Button>
            <form.Subscribe
              selector={({ canSubmit, isSubmitting }) => [
                canSubmit,
                isSubmitting,
              ]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  aria-busy={isSubmitting}
                  disabled={isSubmitting || !canSubmit}
                  className="min-w-[160px]"
                >
                  {t("actions.post")}
                </Button>
              )}
            />
          </div>
        </Card.Base>
      </PageContent>
    </form>
  )
}
