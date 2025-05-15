import { PageContent } from "@/components/PageContent";
import { Button } from "@/components/ui/Button";
import { Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import Stepper, { StepData, StepperRenderProps } from "@/components/Stepper";
import { Badge } from "@/components/ui/Badge";

export const AddNewBadge = () => {
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);

  const { data: badges } = trpc.protocols.badges.useQuery();
  const { data: protocols } = trpc.protocols.all.useQuery();
  const createBadgeMutation = trpc.badges.create.useMutation();

  const handleBadgeSelection = (
    slug: string,
    updateValidity: (isValid: boolean) => void
  ) => {
    setSelectedBadge(slug);
    setIsStep1Valid(true);
    updateValidity(true);
  };

  const handleProtocolSelection = (
    protocolId: string,
    updateValidity: (isValid: boolean) => void
  ) => {
    setSelectedProtocols(prev => {
      const newProtocols = prev.includes(protocolId)
        ? prev.filter(p => p !== protocolId)
        : [...prev, protocolId];
      setIsStep2Valid(newProtocols.length > 0);
      updateValidity(newProtocols.length > 0);
      return newProtocols;
    });
  };

  const handleComplete = useCallback(async () => {
    if (!selectedBadge || selectedProtocols.length === 0) return;

    const badge = badges?.find((b: any) => b.slug === selectedBadge);
    if (!badge) return;

    try {
      await createBadgeMutation.mutateAsync({
        name: badge.name,
        slug: badge.slug,
        description: badge.description,
        protocolIds: selectedProtocols,
        metadata: badge.metadata,
        privateByDefault: badge.privateByDefault,
        expiresAfter: badge.expiresAfter
      });

      setIsComplete(true);
      setTimeout(() => {
        alert("Badge created successfully!");
      }, 100);
    } catch (error) {
      console.error("Failed to create badge:", error);
      alert("Failed to create badge. Please try again.");
    }
  }, [selectedBadge, selectedProtocols, badges, createBadgeMutation]);

  const steps: StepData[] = [
    {
      id: "badge-type",
      label: "Badge Type",
      description: "Select the Badge you want to verify",
      isValid: isStep1Valid,
      render: ({ updateValidity }: StepperRenderProps) => {
        return (
          <Stepper.Step>
            <div className="grid grid-cols-4 gap-3.5">
              {badges?.map((badge: any) => {
                const isActive = selectedBadge === badge.slug;
                return (
                  <Button
                    key={badge.slug}
                    variant="checkbox"
                    size="md"
                    onClick={() => handleBadgeSelection(badge.slug, updateValidity as any)}
                    active={isActive}
                    className="!justify-start"
                  >
                    <div className="size-6 border rounded border-base-border flex items-center justify-center shadow-base">
                      <Mail className="text-base-muted-foreground" />
                    </div>
                    {badge.name}
                  </Button>
                );
              })}
            </div>
          </Stepper.Step>
        );
      },
    },
    {
      id: "protocols",
      label: "Protocols",
      description: "Select one or more protocols to verify this badge",
      isValid: isStep2Valid,
      render: ({ updateValidity }: StepperRenderProps) => {
        return (
          <Stepper.Step>
            <div className="grid grid-cols-4 gap-3.5">
              {protocols?.map((protocol) => {
                const isActive = selectedProtocols.includes(protocol.id);
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
                );
              })}
            </div>
          </Stepper.Step>
        );
      },
    },
    {
      id: "run",
      label: "Run Verification",
      isValid: true,
      render: ({ updateValidity }: StepperRenderProps) => {
        const selectedBadgeData = badges?.find(b => b.slug === selectedBadge);
        const selectedProtocolsData = protocols?.filter(p => selectedProtocols.includes(p.id));

        return (
          <Stepper.Step>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Selected Configuration</h3>
              <div>
                <p className="font-medium">Badge:</p>
                <p className="text-base-muted-foreground">{selectedBadgeData?.name}</p>
              </div>
              <div>
                <p className="font-medium">Protocols:</p>
                <div className="flex gap-2">
                  {selectedProtocolsData?.map(protocol => (
                    <Badge key={protocol.id} variant="secondary">
                      {protocol.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Stepper.Step>
        );
      },
    },
  ];

  return (
    <PageContent title="Add New Badge" className="flex flex-col gap-5">
      <div className="w-full flex flex-col">
        <Stepper.Base
          steps={steps}
          onComplete={handleComplete}
          completeLabel="Create Badge"
        />

        {isComplete && (
          <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-md">
            <p className="text-green-800 font-medium">
              Badge created successfully!
            </p>
          </div>
        )}
      </div>
    </PageContent>
  );
};
