'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { CircleCheckBig } from 'lucide-react'

import { cn } from '@/lib/utils'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-border bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary aspect-square size-6 shrink-0 rounded-full border-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] transition-all outline-none focus-visible:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:focus-visible:shadow-[5px_5px_0px_0px_rgba(255,255,255,1)] disabled:cursor-not-allowed disabled:opacity-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleCheckBig className="text-primary-foreground absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 stroke-[4px] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
