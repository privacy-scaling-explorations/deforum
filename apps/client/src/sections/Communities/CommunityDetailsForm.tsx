import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import { z } from "zod";
import { Input } from "@/components/inputs/Input";
import { Textarea } from "@/components/inputs/Textarea";
import { Card } from "@/components/cards/Card";
import { StepperRenderProps } from "@/components/Stepper";

const nameSchema = z
  .string()
  .min(3, "Name must be at least 3 characters")
  .max(50, "Name must be less than 50 characters");
const shortDescriptionSchema = z
  .string()
  .min(10, "Short description must be at least 10 characters")
  .max(100, "Short description must be less than 100 characters");
const aboutSchema = z
  .string()
  .min(10, "About must be at least 10 characters")
  .max(500, "About must be less than 500 characters");

const communityDetailsSchema = z.object({
  name: nameSchema,
  shortDescription: shortDescriptionSchema,
  about: aboutSchema,
});

export interface CommunityFormRef {
  validateAllFields: () => boolean;
  getFormData: () => { name: string; shortDescription: string; about: string };
  validateAndShowErrors: () => boolean;
}

export type CommunityDetailsFormProps = Omit<
  StepperRenderProps,
  "updateValidity"
>;

export const CommunityDetailsForm = forwardRef<
  CommunityFormRef,
  CommunityDetailsFormProps
>((props, ref) => {
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    about: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    shortDescription: "",
    about: "",
  });
  const [forceUpdate, setForceUpdate] = useState(0);

  const validateField = useCallback(
    (field: keyof typeof formData, value: string) => {
      try {
        if (field === "name") {
          nameSchema.parse(value);
          return "";
        } else if (field === "shortDescription") {
          shortDescriptionSchema.parse(value);
          return "";
        } else if (field === "about") {
          aboutSchema.parse(value);
          return "";
        }
        return "";
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message || "";
        }
        return "";
      }
    },
    []
  );

  const validateAllFields = useCallback(() => {
    const newErrors = {
      name: validateField("name", formData.name),
      shortDescription: validateField(
        "shortDescription",
        formData.shortDescription
      ),
      about: validateField("about", formData.about),
    };

    setErrors(newErrors);

    const isValid = !Object.values(newErrors).some((error) => error !== "");
    return isValid;
  }, [formData, validateField]);

  const validateAndShowErrors = useCallback(() => {
    try {
      // Manually check each field and set appropriate error messages
      const newErrors = {
        name: formData.name
          ? validateField("name", formData.name)
          : "Name is required",
        shortDescription: formData.shortDescription
          ? validateField("shortDescription", formData.shortDescription)
          : "Short description is required",
        about: formData.about
          ? validateField("about", formData.about)
          : "About is required",
      };

      // Update the errors state to display to the user
      setErrors(newErrors);

      // Force a re-render to make sure errors are displayed
      setForceUpdate((prev) => prev + 1);

      // Check if any field has an error
      const isValid = !Object.values(newErrors).some((error) => error !== "");
      return isValid;
    } catch (error) {
      console.error("Form validation error:", error);
      return false;
    }
  }, [formData, validateField]);

  useImperativeHandle(
    ref,
    () => ({
      validateAllFields,
      getFormData: () => formData,
      validateAndShowErrors,
    }),
    [validateAllFields, formData, validateAndShowErrors]
  );

  const handleChange = useCallback(
    (field: keyof typeof formData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setFormData((prev) => ({ ...prev, [field]: newValue }));

        // Clear the error when user starts typing
        if (errors[field]) {
          setErrors((prev) => ({
            ...prev,
            [field]: "",
          }));
        }
      },
    [errors]
  );

  const handleBlur = useCallback(
    (field: keyof typeof formData) => () => {
      const value = formData[field];
      const error = validateField(field, value);

      setErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    },
    [formData, validateField]
  );

  return (
    <Card.Base className="bg-base-primary-foreground">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-base-foreground font-semibold font-inter text-xl">
            Community details
          </h3>
          <span className="text-base-muted-foreground font-inter font-normal text-sm">
            A name and description help users understand what your community is
            all about.
          </span>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="Enter community name"
            value={formData.name}
            onChange={handleChange("name")}
            onBlur={handleBlur("name")}
            error={errors.name}
          />
          <Input
            label="Short Description"
            placeholder="Enter a short description"
            value={formData.shortDescription}
            onChange={handleChange("shortDescription")}
            onBlur={handleBlur("shortDescription")}
            error={errors.shortDescription}
          />
          <Textarea
            label="About"
            placeholder="Tell us more about your community"
            value={formData.about}
            onChange={handleChange("about")}
            onBlur={handleBlur("about")}
            error={errors.about}
          />
        </div>
      </div>
    </Card.Base>
  );
});

CommunityDetailsForm.displayName = "CommunityDetailsForm";
