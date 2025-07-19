"use client"

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Dialog context
type DialogContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

// Modified Dialog component that accepts open state if provided
export function Dialog({ 
  children,
  open: controlledOpen,
  onOpenChange
}: { 
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  // Use internal state if not controlled
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Determine if we're using controlled or uncontrolled state
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  // Function to update the open state
  const setOpen = (newOpen: boolean) => {
    if (isControlled) {
      // For controlled components, call the provided handler
      onOpenChange?.(newOpen);
    } else {
      // For uncontrolled, use the internal state
      setInternalOpen(newOpen);
    }
  };
  
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

// Dialog trigger button
export function DialogTrigger({ 
  children, 
  asChild = false,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  asChild?: boolean;
  children: React.ReactNode;
}) {
  const context = React.useContext(DialogContext);
  
  if (!context) {
    throw new Error("DialogTrigger must be used within a Dialog component");
  }
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    context.setOpen(true);
    if (props.onClick) props.onClick(e);
  };
  
  if (asChild && React.isValidElement(children)) {
    // Type assertion to handle the cloning with props
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }
  
  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

// Dialog content
export function DialogContent({ 
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
}) {
  const context = React.useContext(DialogContext);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!context) {
    throw new Error("DialogContent must be used within a Dialog component");
  }
  
  if (!context.open || !mounted) {
    return null;
  }
  
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80"
        onClick={() => context.setOpen(false)}
      />
      
      {/* Dialog */}
      <div
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg sm:rounded-lg ${className}`}
      {...props}
    >
      {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          onClick={() => context.setOpen(false)}
        >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
        </button>
      </div>
    </>,
    document.body
  );
}

// Helper components
export function DialogHeader({ 
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
  <div
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
  );
}

export function DialogFooter({ 
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
  <div
      className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
  );
}

export function DialogTitle({ 
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
  );
}

export function DialogDescription({ 
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-slate-500 ${className}`} {...props} />
  );
} 