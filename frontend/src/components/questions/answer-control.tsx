"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Star, X } from "lucide-react";
import type { Answer, Question } from "./registry";

type Props = {
  question: Question;
  value: Answer | undefined;
  onChange: (answer: Answer) => void;
  invalid?: boolean;
};

function ChoiceTile({
  label,
  letter,
  selected,
  onClick,
}: {
  label: string;
  letter: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-12 w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-lg transition-colors ${selected ? "border-[var(--answer-accent)] bg-[color-mix(in_srgb,var(--answer-accent)_14%,transparent)]" : "border-[color-mix(in_srgb,var(--answer-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--answer-accent)_5%,transparent)] hover:bg-[color-mix(in_srgb,var(--answer-accent)_10%,transparent)]"}`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded border border-current text-xs font-medium">
        {letter}
      </span>
      <span className="min-w-0 flex-1 break-words">
        {label || "Untitled choice"}
      </span>
      {selected && <Check size={18} aria-hidden="true" />}
    </button>
  );
}

function SearchableDropdown({ question, value, onChange, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const options = question.options ?? [];
  const filtered = options.filter((o) =>
    o.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  const selected = options.find((o) => o.option_key === value);
  const listId = `choices-${question.question_key}`;
  const inputId = `answer-${question.question_key}`;
  function select(index: number) {
    const option = filtered[index];
    if (option) {
      onChange(option.option_key);
      setOpen(false);
      setSearch("");
    }
  }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      setActive((current) =>
        Math.max(
          0,
          Math.min(
            filtered.length - 1,
            open ? current + (event.key === "ArrowDown" ? 1 : -1) : 0,
          ),
        ),
      );
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      event.stopPropagation();
      select(active);
    }
  }
  return (
    <div
      className="relative w-full max-w-lg"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setSearch("");
        }
      }}
    >
      <div className="flex items-center border-b border-current">
        <input
          id={inputId}
          role="combobox"
          aria-label="Your answer"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid}
          aria-describedby={
            invalid ? `error-${question.question_key}` : undefined
          }
          aria-activedescendant={
            open && filtered[active]
              ? `${listId}-${filtered[active].option_key}`
              : undefined
          }
          value={open ? search : (selected?.label ?? "")}
          placeholder={open ? "Search choices…" : "Select an option…"}
          onFocus={() => {
            setOpen(true);
            setSearch("");
            setActive(0);
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={keyboard}
          className="min-h-12 min-w-0 flex-1 bg-transparent py-2 text-xl outline-none placeholder:opacity-45"
        />
        {hasSelection(value) && !question.required && (
          <button
            aria-label="Clear selection"
            onClick={() => {
              onChange(null);
              setSearch("");
            }}
            className="p-2"
          >
            <X size={17} />
          </button>
        )}
        <button
          aria-label="Toggle choices"
          onClick={() => {
            setOpen(!open);
            setSearch("");
            setActive(0);
          }}
          className="p-2"
        >
          <ChevronDown size={20} />
        </button>
      </div>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Choices"
          className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white p-1 text-text shadow-lg"
        >
          {filtered.map((option, index) => (
            <button
              type="button"
              key={option.option_key}
              id={`${listId}-${option.option_key}`}
              role="option"
              aria-selected={value === option.option_key}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => select(index)}
              className={`flex w-full items-center justify-between rounded px-3 py-2 text-left ${index === active ? "bg-surface-muted" : ""}`}
            >
              <span className="break-words">
                {option.label || "Untitled choice"}
              </span>
              {value === option.option_key && <Check size={16} />}
            </button>
          ))}
          {!filtered.length && (
            <p className="px-3 py-4 text-sm text-text-muted">
              No matching choices
            </p>
          )}
        </div>
      )}
    </div>
  );
}
const hasSelection = (value: Answer | undefined) =>
  value !== undefined && value !== null;

export function AnswerControl(props: Props) {
  const { question: q, value, onChange, invalid } = props;
  const id = `answer-${q.question_key}`;
  if (q.type === "dropdown") return <SearchableDropdown {...props} />;
  if (q.type === "multiple_choice" || q.type === "yes_no") {
    const options =
      q.type === "yes_no"
        ? [
            { key: true, label: "Yes", letter: "Y" },
            { key: false, label: "No", letter: "N" },
          ]
        : (q.options ?? []).map((o, i) => ({
            key: o.option_key,
            label: o.label,
            letter: i < 26 ? String.fromCharCode(65 + i) : String(i + 1),
          }));
    return (
      <div
        id={id}
        role="radiogroup"
        aria-label="Your answer"
        aria-invalid={invalid}
        className="grid max-w-lg gap-2"
        onKeyDown={(event) => {
          if (
            !["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(
              event.key,
            )
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          const position = options.findIndex((o) => o.key === value);
          const next =
            (position +
              (event.key === "ArrowDown" || event.key === "ArrowRight"
                ? 1
                : -1) +
              options.length) %
            options.length;
          if (options[next]) {
            onChange(options[next].key);
            (event.currentTarget.children[next] as HTMLElement)?.focus();
          }
        }}
      >
        {options.map((o) => (
          <ChoiceTile
            key={String(o.key)}
            letter={o.letter}
            label={o.label}
            selected={value === o.key}
            onClick={() => onChange(o.key)}
          />
        ))}
        {!options.length && (
          <p className="text-sm opacity-60">
            Add choices in the builder to try this question.
          </p>
        )}
      </div>
    );
  }
  if (q.type === "rating")
    return (
      <div
        id={id}
        role="radiogroup"
        aria-label="Your answer"
        aria-invalid={invalid}
        className="flex flex-wrap gap-2"
        onKeyDown={(event) => {
          if (
            !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(
              event.key,
            )
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          const next = Math.max(
            1,
            Math.min(
              q.rating_max ?? 5,
              (typeof value === "number" ? value : 0) +
                (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1),
            ),
          );
          onChange(next);
          (event.currentTarget.children[next - 1] as HTMLElement)?.focus();
        }}
      >
        {Array.from({ length: q.rating_max ?? 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-label={`${i + 1} star${i ? "s" : ""}`}
            aria-checked={value === i + 1}
            onClick={() => onChange(i + 1)}
            className="flex min-h-14 min-w-10 flex-col items-center gap-1 rounded-md p-1 hover:bg-black/5"
          >
            <Star
              size={32}
              strokeWidth={1.5}
              fill={
                typeof value === "number" && value > i ? "currentColor" : "none"
              }
            />
            <span className="text-xs">{i + 1}</span>
          </button>
        ))}
      </div>
    );
  const shared = {
    id,
    "aria-label": "Your answer",
    "aria-invalid": invalid,
    "aria-describedby": invalid ? `error-${q.question_key}` : undefined,
    value: typeof value === "string" || typeof value === "number" ? value : "",
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    className:
      "w-full border-0 border-b border-current bg-transparent px-0 py-3 text-2xl outline-none placeholder:opacity-45",
    placeholder:
      q.type === "email"
        ? "name@example.com"
        : q.type === "number"
          ? "Type a number here…"
          : "Type your answer here…",
  };
  return q.type === "long_text" ? (
    <textarea
      {...shared}
      rows={4}
      maxLength={10000}
      className={`${shared.className} resize-y`}
    />
  ) : (
    <input
      {...shared}
      type={q.type === "email" ? "email" : "text"}
      inputMode={
        q.type === "number" ? "numeric" : q.type === "email" ? "email" : "text"
      }
      maxLength={
        q.type === "short_text" ? 999 : q.type === "email" ? 254 : undefined
      }
      autoComplete="off"
    />
  );
}
