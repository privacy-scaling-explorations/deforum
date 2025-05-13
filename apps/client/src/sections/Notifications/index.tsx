import { PageContent } from "@/components/PageContent"
import { Bell } from "lucide-react"
import { useTranslation } from 'react-i18next'

export const NotificationsPage = () => {
  const { t } = useTranslation()

  return (
    <PageContent
      title={t('pages.notifications.title')}
      showEmptyState
      emptyState={{
        icon: Bell,
        title: t('pages.notifications.empty'),
      }}
    >
      {t('pages.notifications.not_implemented')}
    </PageContent>
  )
}
