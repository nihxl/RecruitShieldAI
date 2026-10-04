'use client';
import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface TooltipProps extends TooltipPrimitive.TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ children, content, ...props }: TooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root 
        open={open} 
        onOpenChange={setOpen} 
        delayDuration={200}
        {...props}
      >
        <TooltipPrimitive.Trigger asChild>
          <span 
            tabIndex={0}
            onClick={() => setOpen(true)}
            onTouchStart={() => setOpen(true)}
            className="cursor-pointer inline-block"
          >
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-50 overflow-hidden rounded-md px-3 py-1.5 text-[14px] bg-tertiary-container text-on-tertiary-container animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            sideOffset={4}
            collisionPadding={8}
            onEscapeKeyDown={() => setOpen(false)}
            onPointerDownOutside={() => setOpen(false)}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-tertiary-container" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
