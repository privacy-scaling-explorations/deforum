import { PageContent } from "@/components/PageContent"
import { Button } from "@/components/ui/Button"
import { Mail } from "lucide-react"
import { useCallback, useState } from "react"
import { trpc } from "@/lib/trpc"
import Stepper, { StepData, StepperRenderProps } from "@/components/Stepper"
import { Badge } from "@/components/ui/Badge"
import { BadgeDefinition } from "@/shared/schemas/badge"
import { Protocol } from "@/shared/schemas/protocol"
import { useTranslation } from "react-i18next"

export const AddNewBadge = () => {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null)
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [isStep1Valid, setIsStep1Valid] = useState(false)
  const [isStep2Valid, setIsStep2Valid] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const { t } = useTranslation()

  const { data: badges } = trpc.badges.all.useQuery()
  const { data: protocols } = trpc.protocols.all.useQuery()
  const createBadgeMutation = trpc.badges.create.useMutation()
  const verifyAndIssueMutation = trpc.badges.verifyAndIssue.useMutation()

  const handleBadgeSelection = (
    slug: string,
    updateValidity: (isValid: boolean) => void
  ) => {
    setSelectedBadge(slug)
    setIsStep1Valid(true)
    updateValidity(true)
  }

  const handleProtocolSelection = (
    protocolId: string,
    updateValidity: (isValid: boolean) => void
  ) => {
    setSelectedProtocols(prev => {
      const newProtocols = prev.includes(protocolId)
        ? prev.filter(p => p !== protocolId)
        : [...prev, protocolId]
      setIsStep2Valid(newProtocols.length > 0)
      updateValidity(newProtocols.length > 0)
      return newProtocols
    })
  }

  const handleVerify = useCallback(async () => {
    if (!selectedBadge || selectedProtocols.length === 0) return

    setIsVerifying(true)
    try {
      // For dummy badge, we just send a simple proof object
      const proofData = {
        type: 'dummy',
        timestamp: new Date().toISOString(),
        value: 'dummy-proof-value'
      }

      await verifyAndIssueMutation.mutateAsync({
        badgeSlug: selectedBadge,
        protocolSlug: 'dummy-protocol',
        proofData
      })

      setIsComplete(true)
      setTimeout(() => {
        alert(t('pages.badges.add_new.success'))
      }, 100)
    } catch (error) {
      console.error("Failed to verify badge:", error)
      alert("Failed to verify badge. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }, [selectedBadge, selectedProtocols, verifyAndIssueMutation, t])

  const steps: StepData[] = [
    {
      id: "badge-type",
      label: t('pages.badges.add_new.steps.badge_type.label'),
      description: t('pages.badges.add_new.steps.badge_type.description'),
      isValid: isStep1Valid,
      render: ({ updateValidity }: StepperRenderProps) => {
        return (
          <Stepper.Step>
            <div className="grid grid-cols-4 gap-3.5">
              {badges?.map((badge) => {
                const isActive = selectedBadge === badge.slug
                return (
                  <Button
                    key={badge.slug}
                    variant="checkbox"
                    size="md"
                    onClick={() => handleBadgeSelection(badge.slug, updateValidity)}
                    active={isActive}
                    className="!justify-start"
                  >
                    <div className="size-6 border rounded border-base-border flex items-center justify-center shadow-base">
                      <Mail className="text-base-muted-foreground" />
                    </div>
                    {badge.name}
                  </Button>
                )
              })}
            </div>
          </Stepper.Step>
        )
      },
    },
    {
      id: "protocols",
      label: t('pages.badges.add_new.steps.protocols.label'),
      description: t('pages.badges.add_new.steps.protocols.description'),
      isValid: isStep2Valid,
      render: ({ updateValidity }: StepperRenderProps) => {
        return (
          <Stepper.Step>
            <div className="grid grid-cols-4 gap-3.5">
              {protocols?.map((protocol) => {
                const isActive = selectedProtocols.includes(protocol.id)
                return (
                  <Button
                    key={protocol.id}
                    variant="checkbox"
                    size="md"
                    onClick={() => handleProtocolSelection(protocol.id, updateValidity)}
                    active={isActive}
                    className="!justify-start"
                  >
                    <div className="size-6 border rounded border-base-border flex items-center justify-center shadow-base">
                      <Mail className="text-base-muted-foreground" />
                    </div>
                    {protocol.name}
                  </Button>
                )
              })}
            </div>
          </Stepper.Step>
        )
      },
    },
    {
      id: "run",
      label: t('pages.badges.add_new.steps.run.label'),
      description: t('pages.badges.add_new.steps.run.description'),
      isValid: true,
      render: ({ updateValidity }: { updateValidity: (isValid: boolean) => void }) => {
        const selectedBadgeData = badges?.find((b) => b.slug === selectedBadge)
        const selectedProtocolsData = protocols?.filter((p) => selectedProtocols.includes(p.id))

        return (
          <Stepper.Step>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">{t('pages.badges.add_new.selected_config.title')}</h3>
              <div>
                <p className="font-medium">{t('pages.badges.add_new.selected_config.badge')}</p>
                <p className="text-base-muted-foreground">{selectedBadgeData?.name}</p>
              </div>
              <div>
                <p className="font-medium">{t('pages.badges.add_new.selected_config.protocols')}</p>
                <div className="flex gap-2">
                  {selectedProtocolsData?.map(protocol => (
                    <Badge key={protocol.id} variant="secondary">
                      {protocol.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-fit"
              >
                {isVerifying ? t('pages.badges.add_new.selected_config.verifying') : t('pages.badges.add_new.selected_config.verify')}
              </Button>
            </div>
          </Stepper.Step>
        )
      },
    },
  ]

  return (
    <PageContent title={t('pages.badges.add_new.title')} className="flex flex-col gap-5">
      <div className="w-full flex flex-col">
        <Stepper.Base
          steps={steps}
          onComplete={() => { }}
          completeLabel={t('pages.badges.add_new.title')}
        />

        {isComplete && (
          <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-md">
            <p className="text-green-800 font-medium">
              {t('pages.badges.add_new.success')}
            </p>
          </div>
        )}
      </div>
    </PageContent>
  )
}
