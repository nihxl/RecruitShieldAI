import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Icon } from './Icon';

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'destructive-confirm';
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  variant = 'default',
}) => {
  const isDestructive = variant === 'destructive-confirm';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40 animate-in fade-in motion-reduce:animate-none" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-surface-container-low rounded-[var(--radius-card)] shadow-[var(--shadow-level-2)] p-6 z-50 animate-in fade-in zoom-in-95 motion-reduce:animate-none focus:outline-none max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className={`text-h3-desktop font-semibold ${isDestructive ? 'text-error' : 'text-on-surface'}`}>
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-on-surface-variant hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1"
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className="text-body-md text-on-surface-variant mb-6">
              {description}
            </Dialog.Description>
          )}
          <div className="mb-6">{children}</div>
          {footer && <div className="flex justify-end gap-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
