"use client";
import {
  questionTypes,
  type Question,
  type QuestionType,
} from "@/components/questions/registry";

export function QuestionSettings({
  question,
  edit,
  changeType,
}: {
  question: Question | undefined;
  edit: (patch: Partial<Question>) => void;
  changeType: (type: QuestionType) => void;
}) {
  if (!question)
    return (
      <div className="rounded-xl bg-surface-muted p-5 text-xs leading-5 text-text-muted">
        Select a question to edit its settings.
      </div>
    );
  return (
    <div className="h-full overflow-y-auto rounded-xl bg-surface-muted p-4">
      <h2 className="mb-5 text-xs font-medium">Question settings</h2>
      <label className="block text-xs font-medium">
        Answer type
        <select
          aria-label="Answer type"
          value={question.type}
          onChange={(event) => changeType(event.target.value as QuestionType)}
          className="mt-3 min-h-10 w-full rounded-lg border border-border bg-white px-3 text-sm"
        >
          {Object.entries(questionTypes).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-[11px] leading-5 text-text-muted">
        Changing type keeps your prompt. Incompatible answer settings are
        cleared.
      </p>
      <div className="my-5 border-t border-border" />
      <label className="flex min-h-10 items-center justify-between gap-3 text-sm">
        <span>Required</span>
        <input
          aria-label="Required"
          type="checkbox"
          checked={question.required ?? false}
          onChange={(event) => edit({ required: event.target.checked })}
          className="h-4 w-4 accent-[#3a2f3c]"
        />
      </label>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        People must answer before continuing.
      </p>
      {question.type === "rating" && (
        <label className="mt-6 block text-xs">
          Rating scale
          <select
            aria-label="Rating scale"
            value={question.rating_max ?? 5}
            onChange={(event) =>
              edit({ rating_max: Number(event.target.value) })
            }
            className="mt-2 min-h-10 w-full rounded-lg border border-border bg-white px-3"
          >
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1} stars
              </option>
            ))}
          </select>
        </label>
      )}
      {question.type === "number" && (
        <p className="mt-6 rounded-lg border border-border p-3 text-xs leading-5 text-text-muted">
          Whole numbers from 0 to 999,999,999,999,999. Decimals and negative
          numbers aren’t accepted.
        </p>
      )}
      {question.type === "email" && (
        <p className="mt-6 text-xs leading-5 text-text-muted">
          Checks email format. Email deliverability isn’t checked.
        </p>
      )}
      {["short_text", "long_text"].includes(question.type) && (
        <p className="mt-6 text-xs leading-5 text-text-muted">
          Maximum {question.type === "short_text" ? "999" : "10,000"} answer
          characters.
        </p>
      )}
      {["multiple_choice", "dropdown"].includes(question.type) && (
        <p className="mt-6 text-xs leading-5 text-text-muted">
          Single selection. Edit choices directly in the canvas. Use the arrows
          to change their order.
        </p>
      )}
      <div className="mt-8 border-t border-border pt-4 text-xs leading-5 text-text-muted">
        Draft changes are saved automatically. Your published form stays
        unchanged until you publish again.
      </div>
    </div>
  );
}
