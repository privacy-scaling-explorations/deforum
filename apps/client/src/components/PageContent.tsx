import { ReactNode } from "react";
import { Labels } from "@/components/ui/Labels";
import { LucideIcon } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface PageContentProps {
  title?: ReactNode | string;
  description?: string;
  children?: ReactNode;
  showEmptyState?: boolean;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  maxWidth?: number;
  emptyState?: {
    icon: LucideIcon;
    title: string;
    description?: string;
  };
}

export const PageContent = ({
  title,
  description,
  children,
  showEmptyState = false,
  emptyState,
  className,
  titleClassName = "",
  actions,
  maxWidth = 1200,
}: PageContentProps) => {
  return (
    <div
      style={{
        maxWidth: `${maxWidth}px`,
      }}
      className={cn("flex flex-col gap-6 p-4 lg:p-6 mx-auto", className, {
        "h-full": showEmptyState,
      })}
    >
      <div className={cn("flex flex-col gap-2", titleClassName)}>
        {(title || actions) && (
          <div className="flex items-center justify-between">
            {typeof title === "string" ? (
              <Labels.PageTitle className={titleClassName}>
                {title}
              </Labels.PageTitle>
            ) : (
              title
            )}
            {actions}
          </div>
        )}
        {description && (
          <Labels.PageDescription className="">
            {description}
          </Labels.PageDescription>
        )}
      </div>
      {children}
      {showEmptyState && emptyState && (
        <EmptyState
          icon={emptyState.icon}
          title={emptyState.title}
          description={emptyState.description}
        />
      )}
    </div>
  );
};
