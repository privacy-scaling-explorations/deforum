import { 
  createContext, 
  useContext, 
  ReactNode, 
  useState, 
  useCallback,
  useRef
} from 'react';
import { AccessType, CombinationLogic } from '@/sections/Communities/CommunityRequirementsForm';

// Define types for each form step
export interface CommunityDetailsData {
  name: string;
  shortDescription: string;
  about: string;
}

export interface CommunityStyleData {
  avatar?: string;
  cover?: string;
}

export interface CommunityAccessData {
  visibility: AccessType;
  requirements: string[];
  combinationLogic: CombinationLogic;
}

// Combined form data
export interface CommunityFormData {
  details: CommunityDetailsData;
  style: CommunityStyleData;
  access: CommunityAccessData;
  currentStep: number;
  completedSteps: Set<number>;
}

// Context type definition
interface CommunityCreateContextType {
  // Form data
  formData: CommunityFormData;
  
  // Step navigation
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => boolean;
  prevStep: () => void;
  isStepCompleted: (step: number) => boolean;
  goToStep: (step: number) => void;
  
  // Form data setters
  setDetailsData: (data: Partial<CommunityDetailsData>) => void;
  setStyleData: (data: Partial<CommunityStyleData>) => void;
  setAccessData: (data: Partial<CommunityAccessData>) => void;
  
  // Validation
  validateDetailsStep: () => boolean;
  validateStyleStep: () => boolean;
  validateAccessStep: () => boolean;
  validateAllSteps: () => boolean;
  
  // Utility methods
  resetForm: () => void;
  getCompleteFormData: () => CommunityFormData;
}

// Default values
const DEFAULT_DETAILS: CommunityDetailsData = {
  name: '',
  shortDescription: '',
  about: ''
};

const DEFAULT_STYLE: CommunityStyleData = {
  avatar: '',
  cover: ''
};

const DEFAULT_ACCESS: CommunityAccessData = {
  visibility: 'open',
  requirements: [],
  combinationLogic: 'any'
};

const DEFAULT_FORM_DATA: CommunityFormData = {
  details: DEFAULT_DETAILS,
  style: DEFAULT_STYLE,
  access: DEFAULT_ACCESS,
  currentStep: 0,
  completedSteps: new Set()
};

// Create the context
const CommunityCreateContext = createContext<CommunityCreateContextType | undefined>(undefined);

export function CommunityCreateProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<CommunityFormData>(DEFAULT_FORM_DATA);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form data setters
  const setDetailsData = useCallback((data: Partial<CommunityDetailsData>) => {
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, ...data }
    }));
  }, []);

  const setStyleData = useCallback((data: Partial<CommunityStyleData>) => {
    setFormData(prev => ({
      ...prev,
      style: { ...prev.style, ...data }
    }));
  }, []);

  const setAccessData = useCallback((data: Partial<CommunityAccessData>) => {
    setFormData(prev => ({
      ...prev,
      access: { ...prev.access, ...data }
    }));
  }, []);

  // Validation functions
  const validateDetailsStep = useCallback(() => {
    const { name, shortDescription } = formData.details;
    const isValid = name.trim() !== '' && shortDescription.trim() !== '';
    
    if (isValid) {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(0);
        return newSet;
      });
    }
    
    return isValid;
  }, [formData.details]);

  const validateStyleStep = useCallback(() => {
    // Style step is optional, so always valid
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.add(1);
      return newSet;
    });
    return true;
  }, []);

  const validateAccessStep = useCallback(() => {
    const { visibility, requirements } = formData.access;
    
    // For gated or private communities, at least one requirement is needed
    let isValid = true;
    if (visibility !== 'open') {
      isValid = requirements.length > 0;
    }
    
    if (isValid) {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.add(2);
        return newSet;
      });
    }
    
    return isValid;
  }, [formData.access]);

  const validateAllSteps = useCallback(() => {
    return validateDetailsStep() && validateStyleStep() && validateAccessStep();
  }, [validateDetailsStep, validateStyleStep, validateAccessStep]);

  // Navigation functions
  const nextStep = useCallback(() => {
    let canProceed = false;
    
    // Validate current step
    if (currentStep === 0) {
      canProceed = validateDetailsStep();
    } else if (currentStep === 1) {
      canProceed = validateStyleStep();
    } else if (currentStep === 2) {
      canProceed = validateAccessStep();
    }
    
    if (canProceed && currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    }
    
    return canProceed;
  }, [currentStep, validateDetailsStep, validateStyleStep, validateAccessStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const isStepCompleted = useCallback((step: number) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  const goToStep = useCallback((step: number) => {
    // Only allow navigating to completed steps or the next incomplete step
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  }, [currentStep, completedSteps]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  }, []);

  // Get complete form data
  const getCompleteFormData = useCallback(() => {
    return {
      ...formData,
      currentStep,
      completedSteps
    };
  }, [formData, currentStep, completedSteps]);

  const value = {
    formData,
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    isStepCompleted,
    goToStep,
    setDetailsData,
    setStyleData,
    setAccessData,
    validateDetailsStep,
    validateStyleStep,
    validateAccessStep,
    validateAllSteps,
    resetForm,
    getCompleteFormData
  };

  return (
    <CommunityCreateContext.Provider value={value}>
      {children}
    </CommunityCreateContext.Provider>
  );
}

export function useCommunityCreate() {
  const context = useContext(CommunityCreateContext);
  if (context === undefined) {
    throw new Error('useCommunityCreate must be used within a CommunityCreateProvider');
  }
  return context;
} 