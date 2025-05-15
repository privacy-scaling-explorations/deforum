import { ReactNode, useState } from "react";
import { ChevronDown as ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface AccordionItemProps {
  items: {
    label: string | ReactNode;
    children: ReactNode;
  }[];
  className?: string;
  buttonClassName?: string;
  defaultOpen?: boolean;
}

const Accordion = ({
  items = [],
  className,
  buttonClassName,
  defaultOpen = true,
}: AccordionItemProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpen ? 0 : null
  );

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map(({ label, children }, index) => (
        <div key={index} className="flex flex-col">
          {typeof label === "string" ? (
            <button
              onClick={() => toggleAccordion(index)}
              className={cn(
                "p-2 w-full flex justify-between items-center text-left text-[10px] tracking-[0.8px] leading-4 text-black-secondary font-semibold transition",
                buttonClassName
              )}
            >
              {label}
              <ChevronDownIcon
                className={`transform transition-transform size-4 duration-300 text-[#3F3F46] ${openIndex === index ? "rotate-180" : ""}`}
              />
            </button>
          ) : (
            <button
              onClick={() => toggleAccordion(index)}
              className="flex justify-between items-center w-full"
            >
              {label}
              <ChevronDownIcon
                className={`transform transition-transform size-4 duration-300 text-[#3F3F46] ${openIndex === index ? "rotate-180" : ""}`}
              />
            </button>
          )}
          <div
            className={`overflow-hidden transition-all duration-300 w-full ${
              openIndex === index
                ? "max-h-[500px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      ))}
    </div>
  );
};

export { Accordion };
