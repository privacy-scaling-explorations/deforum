import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from "react";
import { Card } from "@/components/cards/Card";
import { StepperRenderProps } from "@/components/Stepper";
import { Upload, Trash2 } from "lucide-react";
import { classed } from "@tw-classed/react";
import { Button } from "@/components/ui/Button";

export interface CommunityStyleFormRef {
  validateAllFields: () => boolean;
  getFormData: () => { avatar?: string; cover?: string };
  validateAndShowErrors: () => boolean;
}

export type CommunityStyleFormProps = Omit<
  StepperRenderProps,
  "updateValidity"
>;

const ImagePreviewCircle = classed.div(
  "size-[84px] rounded-full border border-dashed border-gray duration-200 flex items-center justify-center cursor-pointer bg-base-background hover:bg-base-muted transition-colors overflow-hidden"
);

const CoverImagePreview = classed.div(
  "w-full h-[180px] rounded-md border border-dashed border-gray duration-200 flex items-center justify-center cursor-pointer bg-base-background hover:bg-base-muted transition-colors overflow-hidden"
);

export const CommunityStyleForm = forwardRef<
  CommunityStyleFormRef,
  CommunityStyleFormProps
>((props, ref) => {
  const [formData, setFormData] = useState({
    avatar: "",
    cover: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarUploaded, setAvatarUploaded] = useState(false);
  const [coverUploaded, setCoverUploaded] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setAvatarFile(file);

        if (avatarPreview) URL.revokeObjectURL(avatarPreview);

        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          setAvatarPreview(url);
          // TODO: Upload the file to a server here
          setFormData((prev) => ({ ...prev, avatar: url }));
          setAvatarUploaded(true);
        }
      }
    },
    [avatarPreview]
  );

  const handleCoverChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        setCoverFile(file);

        if (coverPreview) URL.revokeObjectURL(coverPreview);

        if (file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          setCoverPreview(url);
          // TODO: Upload the file to a server here
          setFormData((prev) => ({ ...prev, cover: url }));
          setCoverUploaded(true);
        }
      }
    },
    [coverPreview]
  );

  const handleAvatarClick = useCallback(() => {
    avatarInputRef.current?.click();
  }, []);

  const handleCoverClick = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  const handleDeleteAvatar = useCallback(() => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setFormData((prev) => ({ ...prev, avatar: "" }));
    setAvatarUploaded(false);
  }, [avatarPreview]);

  const handleDeleteCover = useCallback(() => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    setCoverFile(null);
    setFormData((prev) => ({ ...prev, cover: "" }));
    setCoverUploaded(false);
  }, [coverPreview]);

  const validateAllFields = useCallback(() => {
    return true;
  }, []);

  const validateAndShowErrors = useCallback(() => {
    return true;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      validateAllFields,
      getFormData: () => formData,
      validateAndShowErrors,
    }),
    [validateAllFields, formData, validateAndShowErrors]
  );

  return (
    <Card.Base className="bg-base-primary-foreground">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-base-foreground font-semibold font-inter text-xl">
            Style your community
          </h3>
          <span className="text-base-muted-foreground font-inter font-normal text-sm">
            An avatar and a cover image will catch new members attention while
            they visit the community profile.
          </span>
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3.5">
            <h4 className="text-base-foreground font-medium font-inter text-sm">
              Avatar
            </h4>
            
            <div className="flex flex-col gap-4">
              <input
                ref={avatarInputRef}
                type="file"
                onChange={handleAvatarChange}
                className="sr-only"
                accept="image/*"
              />
              
              <ImagePreviewCircle onClick={handleAvatarClick}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="size-6 text-base-muted-foreground mb-1" />
                    <span className="text-xs text-base-muted-foreground">
                      Upload
                    </span>
                  </div>
                )}
              </ImagePreviewCircle>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  className="flex min-h-9 w-1/3 rounded-md text-base-foreground bg-base-background py-1 px-3 text-sm shadow-base border border-base-input focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:text-sm cursor-pointer"
                  value={avatarFile ? avatarFile.name : "Image 1"}
                  readOnly
                  onClick={handleAvatarClick}
                />
                {avatarPreview && (
                  <Button 
                    variant="ghost" 
                    className="p-1 h-auto" 
                    onClick={handleDeleteAvatar}
                  >
                    <Trash2 className="size-4 text-error" />
                  </Button>
                )}
              </div>
              
              {avatarUploaded && (
                <span className="text-xs text-base-muted-foreground -mt-2">
                  Avatar uploaded successfully
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h4 className="text-base-foreground font-medium font-inter text-sm">
              Cover image
            </h4>
            
            <div className="flex flex-col gap-4">
              <input
                ref={coverInputRef}
                type="file"
                onChange={handleCoverChange}
                className="sr-only"
                accept="image/*"
              />
              
              <CoverImagePreview onClick={handleCoverClick}>
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="size-6 text-base-muted-foreground mb-1" />
                    <span className="text-xs text-base-muted-foreground">
                      Upload
                    </span>
                  </div>
                )}
              </CoverImagePreview>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  className="flex min-h-9 w-1/3 rounded-md text-base-foreground bg-base-background py-1 px-3 text-sm shadow-base border border-base-input focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none md:text-sm cursor-pointer"
                  value={coverFile ? coverFile.name : "Image 1"}
                  readOnly
                  onClick={handleCoverClick}
                />
                {coverPreview && (
                  <Button 
                    variant="ghost" 
                    className="p-1 h-auto" 
                    onClick={handleDeleteCover}
                  >
                    <Trash2 className="size-4 text-error" />
                  </Button>
                )}
              </div>
              
              {coverUploaded && (
                <span className="text-xs text-base-muted-foreground -mt-2">
                  Cover image uploaded successfully
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card.Base>
  );
});

CommunityStyleForm.displayName = "CommunityStyleForm";
