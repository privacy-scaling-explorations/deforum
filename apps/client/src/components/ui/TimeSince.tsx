import { useMemo } from "react";
import { classed } from "@tw-classed/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

type TimeSinceProps = {
  isoDateTime?: string
  className?: string
}

const TimeSinceBase = classed.span(
  "italic leading-[10px] text-[10px] font-inter text-base-muted-foreground",
);

// Helper function to format relative time
function getRelativeTimeString(date: Date, lang = navigator.language): string {
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30); // Approximation
  const years = Math.round(days / 365); // Approximation

  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

  if (seconds < 60) {
    return rtf.format(-seconds, "second");
  } else if (minutes < 60) {
    return rtf.format(-minutes, "minute");
  } else if (hours < 24) {
    return rtf.format(-hours, "hour");
  } else if (days < 7) {
    return rtf.format(-days, "day");
  } else if (weeks < 4) { // Display weeks up to ~a month
     return rtf.format(-weeks, "week");
  } else if (months < 12) {
    return rtf.format(-months, "month");
  } else {
    return rtf.format(-years, "year");
  }
}

export const TimeSince = ({ isoDateTime, className }: TimeSinceProps) => {
  const timeSince = useMemo(() => {
    // TODO Server should return a more standardized (ISO 8601) date/time string
    if (!isoDateTime) return "";
    // Attempt to create a parseable ISO string from the potentially non-standard input
    const iso8601 = `${isoDateTime.substring(0, 10)}T${isoDateTime.substring(11).replace(" ", "")}`;
    try {
      const date = new Date(iso8601);
      // Check if the date is valid after parsing
      if (isNaN(date.getTime())) {
        console.error("Invalid date string received:", isoDateTime, "Parsed as:", iso8601);
        return "Invalid date"; // Or return the original string, or empty
      }
      return getRelativeTimeString(date);
    } catch (error) {
      console.error("Error parsing date string:", isoDateTime, error);
      return "Invalid date"; // Or return the original string, or empty
    }
  }, [isoDateTime]);

  return (
    <Tooltip content={isoDateTime ?? ""}>
      <TooltipTrigger asChild>
        <TimeSinceBase className={cn("italic", className)}>{timeSince}</TimeSinceBase>
      </TooltipTrigger>
    </Tooltip>
  )
}
