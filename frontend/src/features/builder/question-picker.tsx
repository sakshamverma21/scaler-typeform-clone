"use client";
import { useState } from "react";
import { Search, CreditCard, Upload } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  questionTypes,
  type QuestionType,
} from "@/components/questions/registry";

export function QuestionPicker({
  open,
  setOpen,
  choose,
  onClosed,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  choose: (type: QuestionType) => void;
  onClosed: () => void;
}) {
  const [search, setSearch] = useState("");
  const types = Object.entries(questionTypes) as [
    QuestionType,
    (typeof questionTypes)[QuestionType],
  ][];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title="Add form elements"
        description="Choose how you’d like people to answer."
        className="max-w-3xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onClosed();
        }}
      >
        <label className="mb-6 flex max-w-sm items-center gap-2 rounded-lg border border-border px-3">
          <Search size={16} className="text-text-muted" />
          <input
            aria-label="Search question types"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search form elements"
            className="min-h-10 min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <div className="grid gap-6 sm:grid-cols-3">
          {["Text", "Contact", "Choice", "Rating", "Other"].map((group) => {
            const items = types.filter(
              ([, item]) =>
                item.group === group &&
                item.label.toLowerCase().includes(search.toLowerCase()),
            );
            if (!items.length) return null;
            return (
              <section key={group}>
                <h3 className="mb-2 text-xs font-semibold">{group}</h3>
                {items.map(([type, { label, icon: Icon, color }]) => (
                  <button
                    key={type}
                    onClick={() => {
                      choose(type);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm hover:bg-surface-muted"
                  >
                    <span
                      className={`flex size-7 items-center justify-center rounded-md ${color}`}
                    >
                      <Icon size={17} />
                    </span>
                    {label}
                  </button>
                ))}
              </section>
            );
          })}
        </div>
        {!types.some(([, item]) =>
          item.label.toLowerCase().includes(search.toLowerCase()),
        ) && (
          <p className="py-5 text-text-muted">
            No question types match your search.
          </p>
        )}
        <div className="mt-7 flex flex-wrap gap-4 border-t border-border pt-4">
          {[
            [CreditCard, "Payment"],
            [Upload, "File upload"],
          ].map(([Icon, label]) => {
            const Glyph = Icon as typeof Upload;
            return (
              <button
                key={String(label)}
                disabled
                className="flex items-center gap-2 text-xs text-text-muted opacity-60"
              >
                <Glyph size={16} />
                {String(label)} · Coming soon
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
