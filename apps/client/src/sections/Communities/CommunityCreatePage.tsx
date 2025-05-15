import { PageContent } from "@/components/PageContent";
import Stepper, { StepData } from "@/components/Stepper";
import { router } from "@/lib/router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useGetUser } from "@/hooks/useAuth";
import { CommunityDetailsForm, CommunityFormRef } from "./CommunityDetailsForm";
import {
  CommunityStyleForm,
  CommunityStyleFormRef,
} from "./CommunityStyleForm";
import {
  CommunityRequirementsForm,
  CommunityRequirementsFormRef,
} from "./CommunityRequirementsForm";
import { Labels } from "@/components/ui/Labels";
import { Check } from "lucide-react";
import { 
  CommunityCreateProvider, 
  useCommunityCreate 
} from "@/contexts/CommunityCreateContext";

const CommunityCreatePageContent = () => {
  const {
    formData,
    currentStep,
    setCurrentStep,
    nextStep,
    validateDetailsStep,
    validateStyleStep,
    validateAccessStep,
    validateAllSteps,
    setDetailsData,
    setStyleData,
    setAccessData,
  } = useCommunityCreate();
  
  const [isComplete, setIsComplete] = useState(false);
  const detailsFormRef = useRef<CommunityFormRef>(null);
  const styleFormRef = useRef<CommunityStyleFormRef>(null);
  const requirementsFormRef = useRef<CommunityRequirementsFormRef>(null);

  const handleDetailsNext = useCallback(() => {
    // Validate and show errors
    if (!detailsFormRef.current) {
      console.error("Form ref is not available");
      return false;
    }

    const isValid = detailsFormRef.current.validateAndShowErrors();
    
    if (isValid) {
      const formData = detailsFormRef.current.getFormData();
      setDetailsData(formData);
      return true;
    } else {
      return false;
    }
  }, [setDetailsData]);

  const handleStyleNext = useCallback(() => {
    if (!styleFormRef.current) {
      console.error("Style form ref is not available");
      return false;
    }

    const isValid = styleFormRef.current.validateAndShowErrors();

    if (isValid) {
      const styleData = styleFormRef.current.getFormData();
      setStyleData(styleData);
      return true;
    } else {
      return false;
    }
  }, [setStyleData]);

  const handleAccessNext = useCallback(() => {
    if (!requirementsFormRef.current) {
      console.error("Requirements form ref is not available");
      return false;
    }

    const isValid = requirementsFormRef.current.validateAndShowErrors();

    if (isValid) {
      const accessData = requirementsFormRef.current.getFormData();
      setAccessData(accessData);
      return true;
    } else {
      return false;
    }
  }, [setAccessData]);

  const handleComplete = () => {
    const isValid = validateAllSteps();
    if (isValid) {
      console.log("Creating community with data:", formData);
      setIsComplete(true);
      // Here you would typically make an API call to create the community
      // router.navigate({ to: "/communities" });
    }
  };

  // Prefill form refs with context data when they mount
  useEffect(() => {
    if (detailsFormRef.current) {
      // Assuming your form has a method to set initial values
      // If not, you'll need to adapt this accordingly
      // detailsFormRef.current.setFormValues(formData.details);
    }
  }, [formData.details]);

  useEffect(() => {
    if (styleFormRef.current) {
      // styleFormRef.current.setFormValues(formData.style);
    }
  }, [formData.style]);

  useEffect(() => {
    if (requirementsFormRef.current) {
      // requirementsFormRef.current.setFormValues(formData.access);
    }
  }, [formData.access]);

  const steps: StepData[] = [
    {
      id: "community-details",
      header: "Details",
      label: "Community details",
      isValid: true,
      render: (props) => (
        <CommunityDetailsForm ref={detailsFormRef} {...props} />
      ),
      onNext: handleDetailsNext,
    },
    {
      id: "community-style",
      header: "Style",
      label: "Style your community",
      isValid: true,
      render: (props) => <CommunityStyleForm ref={styleFormRef} {...props} />,
      onNext: handleStyleNext,
    },
    {
      id: "community-access",
      header: "Access",
      label: "Access & Badge Requirements",
      isValid: true,
      render: (props) => (
        <CommunityRequirementsForm ref={requirementsFormRef} {...props} />
      ),
      onNext: handleAccessNext,
    },
  ];

  if (isComplete) {
    return (
      <PageContent
        title={
          <div className="flex flex-col w-full gap-6">
            <div className="size-[44px] rounded-full bg-green-light flex items-center justify-center mx-auto">
              <Check size={20} />
            </div>
            <Labels.PageTitle className="text-center !w-full">
              Community created!
            </Labels.PageTitle>
          </div>
        }
        description={`Your community "${formData.details.name}" has been successfully created and is ready to welcome members.`}
        titleClassName="!text-center"
        maxWidth={600}
      >
        <div className=""></div>
      </PageContent>
    );
  }

  return (
    <PageContent
      title="Create Community"
      description="Set up your community's profile, style, access requirements, and badge eligibility criteria."
    >
      <Stepper.Base
        steps={steps}
        initialStep={currentStep}
        onStepChange={setCurrentStep}
        onCancel={() => router.navigate({ to: "/communities" })}
        onComplete={handleComplete}
        completeLabel="Create Community"
      />
    </PageContent>
  );
};

export const CommunityCreatePage = () => {
  return (
    <CommunityCreateProvider>
      <CommunityCreatePageContent />
    </CommunityCreateProvider>
  );
};
