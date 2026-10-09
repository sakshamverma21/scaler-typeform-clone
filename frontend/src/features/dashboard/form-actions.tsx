"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { FormMetadata } from "@/lib/api/forms";

export type FormAction = "rename" | "duplicate" | "delete";

export function FormActions({
  form,
  disabled,
  onAction,
}: {
  form: FormMetadata;
  disabled: boolean;
  onAction: (
    action: FormAction,
    form: FormMetadata,
    trigger: HTMLButtonElement,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const actions = [
    { key: "rename" as const, label: "Rename", Icon: Pencil },
    { key: "duplicate" as const, label: "Duplicate", Icon: Copy },
    { key: "delete" as const, label: "Delete", Icon: Trash2 },
  ];
  return (
    <div ref={container} className="relative shrink-0">
      <button
        ref={trigger}
        disabled={disabled}
        aria-label={`Actions for ${form.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setAbove(
            (trigger.current?.getBoundingClientRect().bottom ?? 0) >
              window.innerHeight - 190,
          );
          setOpen((value) => !value);
        }}
        className="flex size-10 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted disabled:opacity-40"
      >
        <MoreHorizontal size={19} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label={`Form actions: ${form.title}`}
          className={`absolute right-0 z-30 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-[var(--shadow-overlay)] ${above ? "bottom-full mb-1" : "top-full mt-1"}`}
          onKeyDown={(event) => {
            const items = Array.from(
              menu.current?.querySelectorAll<HTMLButtonElement>(
                "[role=menuitem]",
              ) ?? [],
            );
            const index = items.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? items.length - 1
                    : (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        items.length) %
                      items.length;
              items[next]?.focus();
            } else if (event.key === "Escape" || event.key === "Tab") {
              if (event.key === "Escape") event.preventDefault();
              setOpen(false);
              trigger.current?.focus();
            }
          }}
        >
          {actions.map(({ key, label, Icon }) => (
            <button
              key={key}
              role="menuitem"
              className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-surface-muted ${key === "delete" ? "mt-1 border-t border-border text-[var(--danger)]" : ""}`}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
                if (trigger.current) onAction(key, form, trigger.current);
              }}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
