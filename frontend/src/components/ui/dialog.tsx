"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  title,
  description,
  children,
  busy = false,
  className = "",
  onOpenAutoFocus,
  onCloseAutoFocus,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  busy?: boolean;
  className?: string;
  onOpenAutoFocus?: (event: Event) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30" />
      <DialogPrimitive.Content
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={(event) => {
          const target = event.target;
          if (
            busy ||
            (target instanceof Element &&
              target.closest(
                '[role="combobox"][aria-expanded="true"], [role="listbox"]',
              ))
          )
            event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        className={`fixed top-1/2 left-1/2 z-50 max-h-[90dvh] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-overlay)] ${className}`}
      >
        <DialogPrimitive.Title className="pr-8 text-lg font-semibold">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-text-muted">
          {description}
        </DialogPrimitive.Description>
        <DialogPrimitive.Close
          aria-label="Close dialog"
          disabled={busy}
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted"
        >
          <X size={18} aria-hidden="true" />
        </DialogPrimitive.Close>
        <div className="mt-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
