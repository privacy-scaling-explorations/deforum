import { classed } from "@tw-classed/react"
import type { FC } from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

const RandomBackgroundColors = [
  "bg-red-600",
  "bg-blue-600",
  "bg-green-600",
  "bg-yellow-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-lime-600",
  "bg-amber-600",
  "bg-fuchsia-600",
  "bg-indigo-600",
]

const AvatarBase = classed(
  AvatarPrimitive.Root,
  "flex overflow-hidden rounded-full shrink-0 relative",
  {
    variants: {
      size: {
        sm: "h-5 w-5",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "size-[78px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
)

const AvatarImage = classed(
  AvatarPrimitive.Image,
  "object-cover aspect-square h-full w-full",
)

const AvatarFallback = classed(
  AvatarPrimitive.Fallback,
  "flex h-full w-full items-center justify-center text-white font-medium",
)

type AvatarProps = React.ComponentProps<typeof AvatarBase> & {
  src?: string
  username?: string | null
  hasRandomBackground?: boolean
  className?: string
  icon?: LucideIcon
  linkToSettings?: boolean
}

export const Avatar: FC<AvatarProps> = ({
  src,
  username,
  hasRandomBackground,
  className,
  children = null,
  icon,
  linkToSettings,
  ...props
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const Icon = icon
  const fallbackBackground =
    hasRandomBackground && username
      ? RandomBackgroundColors[
      username.charCodeAt(0) % RandomBackgroundColors.length
      ]
      : "bg-base-muted"

  // Get initial for fallback text
  const fallbackText = username ? username.charAt(0).toUpperCase() : ''

  const handleClick = () => {
    if (linkToSettings) {
      navigate({ to: '/settings' })
    }
  }

  const avatarContent = (
    <AvatarBase
      {...props}
      className={cn(className, "cursor-pointer hover:opacity-80 transition-opacity")}
      onClick={handleClick}
    >
      <AvatarImage src={src} alt={username || ""} />
      <AvatarFallback className={cn(fallbackBackground, {
        'text-xs': props.size === 'sm',
        'text-base': props.size === 'md',
        'text-lg': props.size === 'lg',
        'text-xl': props.size === 'xl',
      })}>
        {fallbackText}
      </AvatarFallback>
      {Icon && <Icon className="size-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
    </AvatarBase>
  )

  return avatarContent
}
