import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, open, onOpenChange, duration = 4000 }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed bottom-6 left-[50%] translate-x-[-50%] z-50 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className="bg-surface-container-high text-on-surface text-body-md px-4 py-3 rounded-[var(--radius-control)] shadow-[var(--shadow-level-2)] animate-in slide-in-from-bottom-5 fade-in motion-reduce:animate-none pointer-events-auto"
      >
        {message}
      </div>
    </div>
  );
};

// Simple global toast provider for the app
export interface ToastContextType {
  showToast: (message: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const showToast = (msg: string) => {
    setMessage(msg);
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast open={open} onOpenChange={setOpen} message={message} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
