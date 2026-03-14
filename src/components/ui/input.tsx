import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm selection:bg-blue-500/50 selection:text-white file:text-foreground",
  {
    variants: {
      variant: {
        default: "border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9",
        glass: "bg-white/5 border-white/10 hover:border-white/30 focus:border-blue-500/50 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/50 text-white placeholder:text-neutral-600 rounded-xl transition-all shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

function Input({ className, variant, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
