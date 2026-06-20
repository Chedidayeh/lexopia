import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer transition-all duration-300 transform hover:scale-105  active:scale-95 justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // playful, child-friendly default: warm gradient, rounded, and soft shadow
        default:
          "bg-gradient-to-r text-white dark:text-gray-900 bg-primary hover:bg-primary/90 rounded-2xl  transform hover:-translate-y-0.5",
        destructive:
          "bg-destructive rounded-2xl text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        accent:
          "bg-accent rounded-2xl text-white hover:bg-accent/90 focus-visible:ring-accent/20 dark:focus-visible:ring-accent/40",
          outline:
          "border border-black/30 bg-white/95 shadow-sm hover:bg-white  dark:bg-input dark:border-input dark:hover:bg-input/70 rounded-2xl",
        secondary:
          "bg-secondary text-white hover:bg-secondary/90 rounded-2xl shadow-sm",
        ghost:
          "bg-transparent hover:bg-primary/60 hover:text-white rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // slightly larger, touch-friendly sizes for children
        default: "h-11 px-6 py-3 has-[>svg]:px-3 text-base",
        xs: "h-7 gap-1 rounded-lg px-3 text-sm has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-2.5 text-sm",
        lg: "h-12 rounded-2xl px-8 has-[>svg]:px-4 text-lg",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        // responsive sizes: sm on mobile, default on md, lg on lg+
        responsive: "h-9 px-4 text-sm md:h-11 md:px-6 md:text-base lg:h-12 lg:px-8 lg:text has-[>svg]:px-2.5 md:has-[>svg]:px-3 lg:has-[>svg]:px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
