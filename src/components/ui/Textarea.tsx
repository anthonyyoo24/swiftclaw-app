import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
    "flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm selection:bg-blue-500/50 selection:text-white",
    {
        variants: {
            variant: {
                default: "border-input bg-transparent placeholder:text-muted-foreground focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                glass: "bg-white/5 border-white/10 hover:border-white/30 focus:border-blue-500/50 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/50 text-white placeholder:text-neutral-600 rounded-xl transition-all shadow-sm",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

interface TextareaProps
    extends React.ComponentProps<"textarea">,
        VariantProps<typeof textareaVariants> {}

function Textarea({ className, variant, ...props }: TextareaProps) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(textareaVariants({ variant }), className)}
            {...props}
        />
    )
}

export { Textarea, textareaVariants }
