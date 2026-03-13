/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] active:duration-75",
    {
        variants: {
            variant: {
                default:
                    "bg-zinc-900 text-white shadow-md hover:bg-black hover:text-white hover:shadow-xl hover:-translate-y-[1px] dark:bg-white dark:text-black ",
                secondary:
                    "bg-black/5 text-black backdrop-blur-md hover:bg-black/10 border border-transparent hover:border-black/5",
                outline:
                    "border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm",
                accent:
                    "bg-[#007AFF] text-white shadow-[0_4px_12px_rgba(0,122,255,0.3)] hover:bg-[#0070E3] hover:shadow-[0_8px_20px_rgba(0,122,255,0.4)] hover:-translate-y-[1px]",
                ghost:
                    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                destructive:
                    "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-8 px-3 text-xs",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

const Button = React.forwardRef(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };