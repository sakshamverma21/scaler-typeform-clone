"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, Plus, X, Star } from "lucide-react";
import type { Question } from "@/components/questions/registry";
import { TypeBadge } from "./question-list";

function InlineText({
  value,
  onChange,
  label,
  placeholder,
  maxLength,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  maxLength: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.style.height = "0px";
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      maxLength={maxLength}
      placeholder={placeholder}
      className={`block min-h-9 w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-1 py-1 outline-offset-2 placeholder:text-text-muted/60 hover:border-border focus:border-border ${className}`}
    />
  );
}

export function QuestionCanvas({
  question: q,
  position,
  edit,
  add,
}: {
  question: Question | undefined;
  position: number;
  edit: (patch: Partial<Question>) => void;
  add: () => void;
}) {
  if (!q)
    return (
      <div className="m-auto max-w-sm px-6 py-16 text-center">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#eee9f2]">
          <Plus size={26} strokeWidth={1.4} />
        </span>
        <h2 className="text-2xl">Let’s start a conversation</h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          One question at a time. Add your first question to bring this form to
          life.
        </p>
        <button
          onClick={add}
          className="mt-6 rounded-lg bg-text px-5 py-3 text-sm text-white"
        >
          Add your first question
        </button>
      </div>
    );
  const options = q.options ?? [];
  function reorder(from: number, to: number) {
    if (to < 0 || to >= options.length) return;
    const next = [...options];
    const [option] = next.splice(from, 1);
    next.splice(to, 0, option);
    edit({ options: next });
  }
  return (
    <div className="m-auto w-full max-w-[720px] px-5 py-12 sm:px-12">
      <div className="flex items-start gap-3">
        <div className="pt-2">
          <TypeBadge question={q} number={position + 1} />
        </div>
        <div className="min-w-0 flex-1">
          <InlineText
            value={q.title ?? ""}
            onChange={(title) => edit({ title })}
            label="Question prompt"
            placeholder="Your question goes here"
            maxLength={2000}
            className="text-[26px] leading-[34px]"
          />
          {q.required && (
            <span className="mt-1 block text-[10px] text-text-muted">
              * Required
            </span>
          )}
          <InlineText
            value={q.description ?? ""}
            onChange={(description) => edit({ description })}
            label="Question description"
            placeholder="Description (optional)"
            maxLength={2000}
            className="mt-1 text-base leading-6 text-text-muted"
          />
          <div className="mt-7">
            {["multiple_choice", "dropdown"].includes(q.type) ? (
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={option.option_key}
                    className="flex items-center gap-1"
                  >
                    <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-[#dcd8df] bg-[#eeedef] px-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded border border-[#c8c3cd] bg-white text-xs">
                        {index < 26
                          ? String.fromCharCode(65 + index)
                          : index + 1}
                      </span>
                      <input
                        aria-label={`Choice ${index + 1}`}
                        value={option.label}
                        maxLength={500}
                        placeholder={`Choice ${index + 1}`}
                        onChange={(event) =>
                          edit({
                            options: options.map((o) =>
                              o.option_key === option.option_key
                                ? { ...o, label: event.target.value }
                                : o,
                            ),
                          })
                        }
                        className="min-h-10 min-w-0 flex-1 bg-transparent text-base outline-offset-1"
                      />
                    </label>
                    <button
                      aria-label={`Move choice ${index + 1} up`}
                      disabled={index === 0}
                      onClick={() => reorder(index, index - 1)}
                      className="p-1 text-text-muted disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      aria-label={`Move choice ${index + 1} down`}
                      disabled={index === options.length - 1}
                      onClick={() => reorder(index, index + 1)}
                      className="p-1 text-text-muted disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      aria-label={`Remove choice ${index + 1}`}
                      onClick={() =>
                        edit({
                          options: options.filter(
                            (o) => o.option_key !== option.option_key,
                          ),
                        })
                      }
                      className="p-1 text-text-muted hover:text-red-700"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <button
                  disabled={options.length >= 100}
                  onClick={() =>
                    edit({
                      options: [
                        ...options,
                        { option_key: crypto.randomUUID(), label: "" },
                      ],
                    })
                  }
                  className="mt-2 inline-flex min-h-9 items-center gap-2 text-sm underline underline-offset-4 disabled:opacity-30"
                >
                  <Plus size={15} />
                  Add choice
                </button>
              </div>
            ) : q.type === "yes_no" ? (
              <div className="grid max-w-xs gap-2">
                {["Yes", "No"].map((text, i) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 rounded-md border border-border bg-[#eeedef] px-3 py-3"
                  >
                    <span className="rounded border border-border bg-white px-1.5 text-xs">
                      {i ? "N" : "Y"}
                    </span>
                    {text}
                  </div>
                ))}
              </div>
            ) : q.type === "rating" ? (
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: q.rating_max ?? 5 }, (_, i) => (
                  <div key={i} className="text-center text-text-muted">
                    <Star size={30} strokeWidth={1.3} />
                    <span className="mt-1 block text-xs">{i + 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-b border-[#99939d] py-3 text-[22px] text-[#aaa5ae]">
                {q.type === "email"
                  ? "name@example.com"
                  : q.type === "number"
                    ? "Type a number here…"
                    : "Type your answer here…"}
                {q.type === "long_text" && (
                  <p className="mt-3 text-xs">Shift + Enter for a new line</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
