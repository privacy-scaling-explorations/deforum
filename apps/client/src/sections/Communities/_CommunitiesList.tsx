import { Avatar } from "@/components/Avatar"
import { Card } from "@/components/cards/Card"
import { useGetAllCommunities } from '@/hooks/useCommunities'
import { Link } from "@tanstack/react-router"
import { useTranslation } from 'react-i18next'

interface CommunitiesListProps {
  view?: "all" | "joined"
}

export const CommunitiesList = ({ view = "all" }: CommunitiesListProps) => {
  const { data: communities = [] } = useGetAllCommunities()
  const { t } = useTranslation()

  const filteredCommunities = communities
  if (filteredCommunities.length === 0) {
    return <div>{t('pages.communities.empty')}</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {filteredCommunities?.map((community: any) => (
        <Link key={community.id} to="/communities/$slug" params={{ slug: community.slug }}>
          <Card.Base key={community.id} withHover>
            <div className="flex gap-3 items-center">
              <Avatar className="!size-[50px]" src={community.avatar} />
              <div className="flex flex-col">
                <h3 className="text-base lg:text-lg font-semibold text-card-foreground font-inter">
                  {community.name}
                </h3>
                <span className=" text-base-muted-foreground text-xs font-medium line-clamp-1">
                  {community.description}
                </span>
              </div>
            </div>
          </Card.Base>
        </Link>
      ))}
    </div>
  )
}
