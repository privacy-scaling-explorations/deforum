import React, { useState, useCallback, ReactNode, useEffect } from "react";
import { Button } from "./ui/Button";
import { ChevronRight, ChevronLeft, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icons } from "./Icons";

interface StepProps {
  children: ReactNode;
}

export interface StepperRenderProps {
  updateValidity?: (isValid: boolean) => void;
  isValid: boolean;
  stepIndex: number;
  onNext?: () => boolean;
}

export interface StepData {
  id: string;
  header?: string;
  label?: string;
  description?: string;
  isValid?: boolean;
  isCompleted?: boolean;
  nextLabel?: string;
  disabled?: boolean;
  render: (props: StepperRenderProps) => ReactNode;
  onNext?: () => boolean;
}

interface StepperProps {
  steps: StepData[];
  initialStep?: number;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
  stepClassName?: string;
  completeLabel?: string;
  showArrow?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  cancelLabel?: string;
  backLabel?: string;
  showStepIcon?: boolean;
  showButtons?: boolean;
}

export const Step = ({ children }: StepProps) => {
  return <>{children}</>;
};

const StepRenderer = React.memo(
  ({
    step,
    stepIndex,
    updateValidity,
    onStepNext,
  }: {
    step: StepData;
    stepIndex: number;
    updateValidity: (isValid: boolean) => void;
    onStepNext: () => boolean;
  }) => {
    useEffect(() => {
      if (step.isValid) {
        updateValidity(true);
      }
    }, [step.id, step.isValid, updateValidity]);

    return (
      <>
        {step?.render({
          updateValidity,
          isValid: !!step.isValid,
          stepIndex,
          onNext: onStepNext,
        })}
      </>
    );
  }
);

StepRenderer.displayName = "StepRenderer";

const safeArrayLength = (arr: any[] | null | undefined = []): number => {
  return Array.isArray(arr) ? arr.length : 0;
};

const StepperBase = ({
  steps: initialSteps,
  initialStep = 0,
  currentStep: externalCurrentStep,
  onStepChange,
  className = "",
  stepClassName = "",
  completeLabel = "Complete",
  showArrow = true,
  onComplete,
  onCancel,
  cancelLabel = "Cancel",
  backLabel = "Back",
  showStepIcon = true,
  showButtons = true,
}: StepperProps) => {
  const [internalCurrentStep, setInternalCurrentStep] = useState(initialStep);
  
  // Use external currentStep if provided, otherwise use internal state
  const currentStep = externalCurrentStep !== undefined ? externalCurrentStep : internalCurrentStep;
  
  const [steps, setSteps] = useState<StepData[]>(() => {
    const validSteps = Array.isArray(initialSteps) ? initialSteps : [];
    return validSteps.map((step) => ({
      ...step,
      isValid: step.isValid || false,
      isCompleted: step.isCompleted || false,
    }));
  });

  // This effect should run whenever externalCurrentStep changes
  useEffect(() => {
    if (externalCurrentStep !== undefined) {
      console.log("External step updated to:", externalCurrentStep);
      setInternalCurrentStep(externalCurrentStep);
    }
  }, [externalCurrentStep]);

  // Log when the current step actually changes in the component
  useEffect(() => {
    console.log("Current step being used:", currentStep);
  }, [currentStep]);

  // Update steps when initialSteps changes
  useEffect(() => {
    const validSteps = Array.isArray(initialSteps) ? initialSteps : [];
    setSteps(
      validSteps.map((newStep, index) => {
        const currentStep = steps[index];
        return {
          ...newStep,
          isValid:
            newStep.isValid !== undefined
              ? newStep.isValid
              : currentStep?.isValid || false,
          isCompleted:
            newStep.isCompleted !== undefined
              ? newStep.isCompleted
              : currentStep?.isCompleted || false,
        };
      })
    );
  }, [initialSteps]);

  const getCurrentStep = useCallback((): StepData | null => {
    const stepsLength = safeArrayLength(steps);
    if (stepsLength === 0) return null;
    return currentStep >= 0 && currentStep < stepsLength
      ? steps[currentStep]
      : null;
  }, [steps, currentStep]);

  const updateStepValidity = useCallback(
    (stepIndex: number, isValid: boolean): void => {
      const stepsLength = safeArrayLength(steps);
      if (!Array.isArray(steps) || stepIndex < 0 || stepIndex >= stepsLength)
        return;

      setSteps((prev) => {
        const safeArray = Array.isArray(prev) ? prev : [];
        return safeArray.map((step, idx) =>
          idx === stepIndex ? { ...step, isValid } : step
        );
      });
    },
    [steps]
  );

  const completeStep = useCallback((stepIndex: number): void => {
    const stepsLength = safeArrayLength(steps);
    if (!Array.isArray(steps) || stepIndex < 0 || stepIndex >= stepsLength)
      return;

    setSteps((prev) => {
      const safeArray = Array.isArray(prev) ? prev : [];
      return safeArray.map((step, idx) =>
        idx === stepIndex ? { ...step, isCompleted: true } : step
      );
    });
  }, [steps]);

  const nextStep = useCallback((): boolean => {
    const stepsLength = safeArrayLength(steps);
    if (stepsLength === 0 || currentStep >= stepsLength - 1) return false;

    completeStep(currentStep);
    const newStep = currentStep + 1;
    
    // Update internal state
    setInternalCurrentStep(newStep);
    
    // Notify parent component if callback provided
    if (onStepChange) {
      onStepChange(newStep);
    }
    
    return true;
  }, [currentStep, steps, completeStep, onStepChange]);

  const prevStep = useCallback((): boolean => {
    if (currentStep <= 0) return false;
    
    const newStep = currentStep - 1;
    
    // Update internal state
    setInternalCurrentStep(newStep);
    
    // Notify parent component if callback provided
    if (onStepChange) {
      onStepChange(newStep);
    }
    
    return true;
  }, [currentStep, onStepChange]);

  const handleStepClick = useCallback(
    (stepIndex: number): boolean => {
      const stepsLength = safeArrayLength(steps);
      if (stepsLength === 0 || stepIndex < 0 || stepIndex >= stepsLength)
        return false;

      const safeSteps = Array.isArray(steps) ? steps : [];
      const isAccessible =
        stepIndex <= currentStep + 1 &&
        (stepIndex === 0 ||
          safeSteps.slice(0, stepIndex).every((step) => step.isCompleted));

      if (isAccessible) {
        // Update internal state
        setInternalCurrentStep(stepIndex);
        
        // Notify parent component if callback provided
        if (onStepChange) {
          onStepChange(stepIndex);
        }
        
        return true;
      }

      return false;
    },
    [currentStep, steps, onStepChange]
  );

  const handleNext = () => {
    const stepsLength = safeArrayLength(steps);
    const isLastStep = stepsLength > 0 && currentStep === stepsLength - 1;
    const currentStepData = steps?.[currentStep];

    if (isLastStep) {
      if (onComplete && typeof onComplete === "function") {
        if (currentStepData?.onNext) {
          const shouldProceed = currentStepData.onNext();
          if (shouldProceed) {
            onComplete();
          }
        } else {
          onComplete();
        }
      }
    } else {
      if (currentStepData?.onNext) {
        const shouldProceed = currentStepData.onNext();
        if (shouldProceed) {
          updateStepValidity(currentStep, true);
          nextStep();
        }
      } else {
        nextStep();
      }
    }
  };

  const handleCancel = () => {
    if (onCancel && typeof onCancel === "function") {
      onCancel();
    }
  };

  // Force re-render when currentStep changes
  const currentStepData = React.useMemo(() => {
    return getCurrentStep();
  }, [getCurrentStep, currentStep, steps]);
  
  const stepsLength = safeArrayLength(steps);
  const isLastStep = stepsLength > 0 && currentStep === stepsLength - 1;
  const isFirstStep = currentStep === 0;

  if (stepsLength === 0) {
    return null;
  }

  const safeSteps = Array.isArray(steps) ? steps : [];

  return (
    <div className={cn("w-full flex flex-col gap-10", className)}>
      <div className="flex items-center gap-2 pb-3 border-b border-b-sidebar-border">
        {safeSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = !!step.isCompleted;
          const isClickable = index <= currentStep || isCompleted;
          const isLastStep = index === safeSteps.length - 1;

          return (
            <React.Fragment key={step.id || index}>
              <div
                className={`flex flex-col items-center ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${stepClassName}`}
                onClick={() => isClickable && handleStepClick(index)}
              >
                <div className="flex items-center gap-1.5">
                  {showStepIcon && (
                    <>
                      {isCompleted ? (
                        <Icons.Check />
                      ) : (
                        <CircleCheck
                          className={cn(
                            "h-5 w-5 text-black",
                            !isActive && "opacity-50"
                          )}
                        />
                      )}
                    </>
                  )}

                  <span
                    className={`text-sm ${isActive || isCompleted ? "font-medium" : "font-normal"}`}
                  >
                    {step.header || step.label}
                  </span>
                </div>
              </div>
              {!isLastStep && (
                <ChevronRight className="text-base-muted-foreground h-4 w-4" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex flex-col gap-3.5">
        {currentStepData?.description && (
          <h3 className="text-sm text-base-foreground font-semibold font-inter">
            {currentStepData?.description}
          </h3>
        )}
        {currentStepData && (
          <StepRenderer
            step={currentStepData}
            stepIndex={currentStep}
            updateValidity={(isValid: boolean) =>
              updateStepValidity(currentStep, isValid)
            }
            onStepNext={() => {
              if (currentStepData.onNext) {
                return currentStepData.onNext();
              }
              return true;
            }}
          />
        )}
      </div>

      {showButtons && (
        <div className="flex gap-3.5 mt-6 ml-auto">
          <div>
            {isFirstStep ? (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="min-w-[120px]"
              >
                {cancelLabel}
              </Button>
            ) : (
              <Button
                onClick={prevStep}
                variant="outline"
                className="min-w-[60px]"
              >
                <div className="flex items-center gap-1">{backLabel}</div>
              </Button>
            )}
          </div>

          <div>
            {!isLastStep ? (
              <Button onClick={handleNext} className="min-w-[180px]">
                <div className="flex items-center gap-1">
                  {currentStepData?.nextLabel || "Next"}
                  {showArrow && <ChevronRight className="h-4 w-4" />}
                </div>
              </Button>
            ) : (
              <Button onClick={handleNext} className="min-w-[180px]">
                {completeLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Stepper = {
  displayName: "Stepper",
  Base: StepperBase,
  Step,
};

export default Stepper;
