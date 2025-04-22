import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"



export enum Format {
  Markdown = "markdown",
  Latex = "latex",
  Raw = "raw",
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function detectFormat(text: string) {
  if (/\$\$[\s\S]*?\$\$/.test(text) || /\$[^$]+\$/.test(text)) {
    return Format.Latex
  }

  if (/(^#{1,6} |\*\*|__|`{1,3}|\[.*?\]\(.*?\)|\*|-)/m.test(text)) {
    return Format.Markdown
  }

  return Format.Raw
}
