"use client"

import React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip = TooltipPrimitive.Root

export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef(
    ({ className, sideOffset = 4, ...props }, ref) => (
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={`z-50 overflow-hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 ${className}`}
            {...props}
        />
    )
)

TooltipContent.displayName = "TooltipContent"