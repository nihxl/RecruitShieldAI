'use client';
import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Icon, IconName } from './Icon';
import { Chip } from './Chip';

export interface AccordionItemProps extends Omit<React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>, 'value'> {
  value: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  variant?: 'default' | 'locked' | 'added';
  children?: React.ReactNode;
}

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, title, subtitle, icon, variant = 'default', children, className = '', ...props }, ref) => {
    const isLocked = variant === 'locked';
    const isAdded = variant === 'added';
    
    return (
      <AccordionPrimitive.Item 
        ref={ref} 
        value={value} 
        className={`border-b border-outline-variant last:border-none ${className}`}
        {...props}
      >
        <AccordionPrimitive.Header className="flex">
          <AccordionPrimitive.Trigger
            className={`group flex flex-1 items-center gap-4 p-6 text-left transition-all [&[data-state=open]_.chevron]:rotate-180 [&[data-state=open]_.icon-well]:text-primary ${
              isLocked ? 'opacity-60 pointer-events-none' : 'hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-surface-container-low'
            }`}
            disabled={isLocked}
            aria-disabled={isLocked}
          >
            {icon && (
              <div className="icon-well flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors">
                <Icon name={isLocked ? 'lock' : icon} />
              </div>
            )}
            
            <div className="flex flex-1 flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-body-md font-semibold text-on-surface">{title}</span>
                {isAdded && (
                  <div className="flex h-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 px-1.5 text-secondary border border-secondary/40">
                    <Icon name="check_circle" size={14} />
                  </div>
                )}
                {isLocked && (
                  <Chip variant="neutral" label="Coming Soon" className="h-6" />
                )}
              </div>
              {subtitle && (
                <span className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</span>
              )}
            </div>

            {!isLocked && (
              <div className="chevron text-on-surface-variant shrink-0 transition-transform duration-200">
                <Icon name="expand_more" />
              </div>
            )}
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
        
        {!isLocked && (
          <AccordionPrimitive.Content className="overflow-hidden text-body-md text-on-surface data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="px-[88px] pb-6 pt-0">
              {children}
            </div>
          </AccordionPrimitive.Content>
        )}
      </AccordionPrimitive.Item>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';
