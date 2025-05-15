import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Card } from "@/components/cards/Card";
import Stepper, { StepData, StepperRenderProps } from "@/components/Stepper";
import { classed } from "@tw-classed/react";
import { CommunityTypeIconMapping } from "./../../global";
import { Edit, Info, Mail, Plus, Trash } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/inputs/Input";
import { useCommunityCreate } from "@/contexts/CommunityCreateContext";

export type AccessType = "open" | "gated" | "private";
export type CombinationLogic = "any" | "all";

export interface CommunityRequirementsFormRef {
  validateAllFields: () => boolean;
  getFormData: () => {
    visibility: AccessType;
    requirements: string[];
    combinationLogic: CombinationLogic;
  };
  validateAndShowErrors: () => boolean;
  setFormValues?: (values: { 
    visibility: AccessType; 
    requirements: string[];
    combinationLogic: CombinationLogic;
  }) => void;
}

export type CommunityRequirementsFormProps = {
  onStepValidityChange?: (isValid: boolean) => void;
};

const AccessTypeCard = classed.div(
  "flex flex-col gap-2 p-6 border-[1.5px] border-transparent rounded-md cursor-pointer transition-colors hover:border-base-brand",
  {
    variants: {
      isSelected: {
        true: "border-base-primary bg-base-brand/5",
        false: "border-base-border bg-base-background",
      },
    },
    defaultVariants: {
      isSelected: false,
    },
  }
);

export const CommunityRequirementsForm = forwardRef<
  CommunityRequirementsFormRef,
  CommunityRequirementsFormProps
>((props, ref) => {
  // Get context values
  const { formData, setAccessData } = useCommunityCreate();
  
  // Initialize state from context if available
  const [accessType, setAccessType] = useState<AccessType>(formData.access.visibility || "open");
  const [requirements, setRequirements] = useState<string[]>(formData.access.requirements || []);
  const [badgeSelectionComplete, setBadgeSelectionComplete] = useState(false);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  const [domain, setDomain] = useState<string>("");
  const [badgeList, setBadgeList] = useState<string[]>(formData.access.requirements || []);
  const [gatedCurrentStep, setGatedCurrentStep] = useState(0);
  const [isAddingBadge, setIsAddingBadge] = useState(false);
  const [editingBadgeIndex, setEditingBadgeIndex] = useState<number | null>(
    null
  );
  const [editBadgeValue, setEditBadgeValue] = useState<string>("");
  const [combinationLogic, setCombinationLogic] =
    useState<CombinationLogic>(formData.access.combinationLogic || "any");
  const { data: badges } = trpc.protocols.badges.useQuery();

  // Update context whenever state changes
  useEffect(() => {
    setAccessData({
      visibility: accessType,
      requirements: badgeList,
      combinationLogic,
    });
  }, [accessType, badgeList, combinationLogic, setAccessData]);

  const validateAllFields = useCallback(() => {
    // For open communities, no validation needed
    if (accessType === "open") return true;

    // For gated and private communities, requirements must be selected
    return badgeSelectionComplete || badgeList.length > 0;
  }, [accessType, badgeSelectionComplete, badgeList]);

  const validateAndShowErrors = useCallback(() => {
    const isValid = validateAllFields();
    // Here you would show errors if not valid
    return isValid;
  }, [validateAllFields]);

  const setFormValues = useCallback((values: { 
    visibility: AccessType; 
    requirements: string[];
    combinationLogic: CombinationLogic;
  }) => {
    setAccessType(values.visibility);
    setBadgeList(values.requirements);
    setCombinationLogic(values.combinationLogic);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      validateAllFields,
      getFormData: () => ({
        visibility: accessType,
        requirements: badgeList,
        combinationLogic,
      }),
      validateAndShowErrors,
      setFormValues,
    }),
    [
      validateAllFields,
      accessType,
      badgeList,
      validateAndShowErrors,
      combinationLogic,
      setFormValues,
    ]
  );

  useEffect(() => {
    if (props.onStepValidityChange) {
      props.onStepValidityChange(
        accessType === "open" || badgeSelectionComplete
      );
    }
  }, [accessType, badgeSelectionComplete, props.onStepValidityChange]);

  const OpenCommunityIcon = CommunityTypeIconMapping?.open;
  const GatedCommunityIcon = CommunityTypeIconMapping?.gated;
  const PrivateCommunityIcon = CommunityTypeIconMapping?.private;

  const handleBadgeSelection = (selected: string[]) => {
    setSelectedProtocols(selected);
    // Move to the next step after selection
    setGatedCurrentStep(1);
    if (props.onStepValidityChange) {
      props.onStepValidityChange(true);
    }
  };

  const handleCompleteGated = () => {
    setBadgeSelectionComplete(true);
    if (props.onStepValidityChange) {
      props.onStepValidityChange(true);
    }
  };

  const handleStepChange = (step: number) => {
    console.log("Step changed to:", step);
    setGatedCurrentStep(step);
  };

  const handleEditBadge = (index: number) => {
    setEditingBadgeIndex(index);
    setEditBadgeValue(badgeList[index]);
  };

  const handleSaveEditedBadge = () => {
    if (editingBadgeIndex !== null && editBadgeValue.trim()) {
      const updatedBadges = [...badgeList];
      updatedBadges[editingBadgeIndex] = editBadgeValue;
      setBadgeList(updatedBadges);
      setEditingBadgeIndex(null);
      setEditBadgeValue("");
    }
  };

  const handleDeleteBadge = (index: number) => {
    const updatedBadges = badgeList.filter((_, i) => i !== index);
    setBadgeList(updatedBadges);
  };

  const steps: StepData[] = [
    {
      id: "badge-type",
      label: "Badge List",
      description: "Select a badge type",
      isValid: false,
      render: ({ updateValidity }: StepperRenderProps) => {
        return (
          <Stepper.Step>
            <div className="grid grid-cols-4 gap-3.5">
              {badges?.map((badge: any) => {
                const isActive = selectedProtocols.includes(badge.slug);
                return (
                  <Button
                    key={badge.slug}
                    variant="checkbox"
                    size="md"
                    onClick={() => {
                      handleBadgeSelection([badge.slug]);
                    }}
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
      id: "type",
      label: "Email",
      isValid: false,
      render: ({ updateValidity }: StepperRenderProps) => {
        return (
          <Stepper.Step>
            {isAddingBadge ? (
              <div className="flex flex-col">
                <div className="flex flex-col gap-4">
                  {badgeList?.map((badge, index) => {
                    return (
                      <div
                        key={index}
                        className="flex justify-between w-full p-3.5 border border-base-border rounded-[6px] bg-white"
                      >
                        {editingBadgeIndex === index ? (
                          <div className="flex gap-[10px] w-full">
                            <div className="size-6 border rounded border-base-border flex items-center justify-center shadow-base">
                              <Mail className="text-base-muted-foreground size-[14px]" />
                            </div>
                            <div className="flex flex-col w-full">
                              <span className="text-base-foreground font-medium text-sm">
                                Email Badge
                              </span>
                              <Input
                                value={editBadgeValue}
                                onChange={(e) =>
                                  setEditBadgeValue(e.target.value)
                                }
                                className="mt-1"
                              />
                              <div className="flex gap-3 mt-2">
                                <Button onClick={handleSaveEditedBadge}>
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingBadgeIndex(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-[10px]">
                              <div className="size-6 border rounded border-base-border flex items-center justify-center shadow-base">
                                <Mail className="text-base-muted-foreground size-[14px]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-base-foreground font-medium text-sm">
                                  Email Badge
                                </span>
                                <span className="text-base-muted-foreground text-sm">
                                  {badge}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-3 mr-5">
                              <Button
                                variant="transparent"
                                size="icon"
                                icon={Edit}
                                className="w-full"
                                onClick={() => handleEditBadge(index)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="transparent"
                                size="icon"
                                icon={Trash}
                                className="ml-5 w-full"
                                onClick={() => handleDeleteBadge(index)}
                              >
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex gap-3">
                    <Button
                      icon={Plus}
                      onClick={() => {
                        setIsAddingBadge(false);
                      }}
                    >
                      Add new badge
                    </Button>
                  </div>
                </div>
                <div className="h-[1px] bg-base-border my-6 w-full"></div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-base-foreground text-base mb-1">
                      Combination logic
                    </h3>
                    <span className="text-base-muted-foreground text-sm">
                      Define how you want to compare the badges
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          checked={combinationLogic === "any"}
                          onChange={() => setCombinationLogic("any")}
                          className="peer sr-only"
                        />
                        <div className="size-5 rounded-full border border-base-border flex items-center justify-center peer-checked:border-[5px] peer-checked:border-base-primary transition-all"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base-foreground text-sm">
                          Match any badge
                        </span>
                        <span className="text-base-muted-foreground text-sm">
                          Users with one of the listed badges can join
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          checked={combinationLogic === "all"}
                          onChange={() => setCombinationLogic("all")}
                          className="peer sr-only"
                        />
                        <div className="size-5 rounded-full border border-base-border flex items-center justify-center peer-checked:border-[5px] peer-checked:border-base-primary transition-all"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-base-foreground text-sm">
                          Match all badge
                        </span>
                        <span className="text-base-muted-foreground text-sm">
                          Only users matching all listed badges are allowed to
                          join
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Input
                  label="Email domain"
                  description="Users must have an email address with this domain to meet this requirement."
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                  }}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (domain.trim()) {
                        setIsAddingBadge(true);
                        setBadgeList([...badgeList, domain]);
                        setDomain("");
                      }
                    }}
                  >
                    Add badge
                  </Button>
                  <Button variant="outline">Add badge</Button>
                </div>
              </div>
            )}
          </Stepper.Step>
        );
      },
    },
  ];

  return (
    <Card.Base className="bg-base-primary-foreground">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-base-foreground font-semibold font-inter text-xl">
            Access & Badge Requirements
          </h3>
          <span className="text-base-muted-foreground font-inter font-normal text-sm">
            Set who can view, post, or contribute to this community based on
            selected criteria.
          </span>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-4">
              <AccessTypeCard
                isSelected={accessType === "open"}
                onClick={() => {
                  setAccessType("open");
                  if (props.onStepValidityChange) {
                    props.onStepValidityChange(true);
                  }
                }}
              >
                <div className="grid grid-cols-[26px_1fr] gap-3 mb-2">
                  <OpenCommunityIcon className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-base-foreground font-medium">
                      Open
                    </span>
                    <p className="text-base-muted-foreground text-sm">
                      Anyone can view, post and comment to this community
                    </p>
                  </div>
                </div>
              </AccessTypeCard>

              <AccessTypeCard
                isSelected={accessType === "gated"}
                onClick={() => {
                  setAccessType("gated");
                  // Gated communities require badge selection
                  if (props.onStepValidityChange) {
                    props.onStepValidityChange(badgeSelectionComplete);
                  }
                }}
              >
                <div className="grid grid-cols-[26px_1fr] gap-3 mb-2">
                  <GatedCommunityIcon className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-base-foreground font-medium">
                      Gated
                    </span>
                    <p className="text-base-muted-foreground text-sm">
                      Anyone can view, but only approved members can contribute
                      to this community
                    </p>
                  </div>
                </div>
              </AccessTypeCard>

              <AccessTypeCard
                isSelected={accessType === "private"}
                onClick={() => {
                  setAccessType("private");
                  // Private communities require badge selection
                  if (props.onStepValidityChange) {
                    props.onStepValidityChange(badgeSelectionComplete);
                  }
                }}
              >
                <div className="grid grid-cols-[26px_1fr] gap-3 mb-2">
                  <PrivateCommunityIcon className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-base-foreground font-medium">
                      Private
                    </span>
                    <p className="text-base-muted-foreground text-sm">
                      Only approved members can view and contribute this
                      community
                    </p>
                  </div>
                </div>
              </AccessTypeCard>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {["open", "private"].includes(accessType) && (
              <Info className="w-5 h-5 text-purple mt-0.5" />
            )}
            <span className="text-xs text-purple">
              {accessType === "open" &&
                "Your community is open to everyone. No badge requirements needed."}
              {accessType === "private" &&
                "Members will need to meet specific badge requirements to view and contribute."}
            </span>
          </div>

          {accessType === "gated" && (
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-base-foreground">
                  Badge Requirements
                </h3>
                <span className="font-inter text-sm text text-base-muted-foreground">
                  Badges define who can access your gated community. Users must
                  meet these requirements to join.
                </span>
              </div>
              <Stepper.Base
                steps={steps}
                onComplete={handleCompleteGated}
                completeLabel="Create Badge"
                showButtons={false}
                currentStep={gatedCurrentStep}
                onStepChange={handleStepChange}
              />
            </div>
          )}

          {accessType === "private" && null}
        </div>
      </div>
    </Card.Base>
  );
});

CommunityRequirementsForm.displayName = "CommunityRequirementsForm";
