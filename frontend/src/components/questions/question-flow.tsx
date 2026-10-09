"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, ArrowRight, Check, RotateCcw } from "lucide-react";
import type { DraftDefinition } from "@/lib/api/forms";
import { ApiError } from "@/lib/api/client";
import { AnswerControl } from "./answer-control";
import {
  hasAnswer,
  normalizedAnswer,
  validateAnswer,
  type Answer,
} from "./registry";

export function QuestionFlow({
  definition,
  preview = false,
  onComplete,
}: {
  definition: DraftDefinition;
  preview?: boolean;
  onComplete?: (answers: Record<string, Answer>) => Promise<void>;
}) {
  const questions = definition.questions ?? [];
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState(1);
  const locked = useRef(false);
  const unlock = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const q = questions[position];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [position]);
  useEffect(
    () => () => {
      if (unlock.current) clearTimeout(unlock.current);
    },
    [],
  );
  const theme = definition.theme_settings;
  const style = {
    "--answer-accent": theme?.accent ?? "#2563eb",
    backgroundColor: theme?.background ?? "#ffffff",
    color: theme?.text ?? "#2a222b",
  } as CSSProperties;
  function answer(value: Answer) {
    setAnswers((current) => ({ ...current, [q.question_key]: value }));
    setError(null);
  }
  function move(next: number) {
    if (locked.current || submitting || next < 0 || next >= questions.length)
      return;
    locked.current = true;
    setTransitioning(true);
    setDirection(next > position ? 1 : -1);
    setError(null);
    setPosition(next);
    unlock.current = setTimeout(
      () => {
        locked.current = false;
        setTransitioning(false);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 250,
    );
  }
  async function advance() {
    if (!q || locked.current || submitting) return;
    const message = validateAnswer(q, answers[q.question_key]);
    if (message) {
      setError(message);
      return;
    }
    if (position < questions.length - 1) {
      move(position + 1);
      return;
    }
    const invalid = questions.findIndex((question) =>
      validateAnswer(question, answers[question.question_key]),
    );
    if (invalid >= 0) {
      setPosition(invalid);
      setError(
        validateAnswer(
          questions[invalid],
          answers[questions[invalid].question_key],
        ),
      );
      return;
    }
    const normalized = Object.fromEntries(
      questions.map((question) => [
        question.question_key,
        normalizedAnswer(question, answers[question.question_key]),
      ]),
    );
    if (preview) {
      setCompleted(true);
      return;
    }
    if (!onComplete) {
      setError("Submission is unavailable. Please try again later.");
      return;
    }
    setSubmitting(true);
    try {
      await onComplete(normalized);
      setCompleted(true);
    } catch (failure) {
      if (failure instanceof ApiError) {
        const issue = failure.errors.find((item) => item.question_key);
        const index = questions.findIndex(
          (item) => item.question_key === issue?.question_key,
        );
        if (index >= 0) setPosition(index);
      }
      setError(
        failure instanceof Error
          ? failure.message
          : "Couldn’t submit. Your answers are kept here.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const progress = completed
    ? 100
    : questions.length
      ? Math.round(
          (questions.filter((question) =>
            hasAnswer(answers[question.question_key]),
          ).length /
            questions.length) *
            100,
        )
      : 0;
  return (
    <div
      className="@container/flow relative flex min-h-full flex-1 flex-col"
      style={style}
      onKeyDown={(event) => {
        if (
          event.nativeEvent.isComposing ||
          event.repeat ||
          submitting ||
          completed ||
          !q
        )
          return;
        const target = event.target as HTMLElement;
        const editable =
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable;
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.defaultPrevented &&
          target.tagName !== "BUTTON"
        ) {
          event.preventDefault();
          void advance();
        }
        if (
          !editable &&
          !target.closest('[role="radiogroup"]') &&
          ["ArrowUp", "ArrowDown"].includes(event.key)
        ) {
          event.preventDefault();
          if (event.key === "ArrowUp") move(position - 1);
          else if (position < questions.length - 1) void advance();
        }
        if (
          !editable &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          /^[a-z]$/i.test(event.key)
        ) {
          if (q.type === "multiple_choice") {
            const option =
              q.options?.[event.key.toUpperCase().charCodeAt(0) - 65];
            if (option) {
              event.preventDefault();
              answer(option.option_key);
            }
          }
          if (
            q.type === "yes_no" &&
            ["y", "n"].includes(event.key.toLowerCase())
          ) {
            event.preventDefault();
            answer(event.key.toLowerCase() === "y");
          }
        }
      }}
    >
      <div
        role="progressbar"
        aria-label="Answered progress"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 w-full bg-black/5"
      >
        <div
          className="h-full bg-[var(--answer-accent)] transition-[width] duration-250"
          style={{ width: `${progress}%` }}
        />
      </div>
      {!questions.length ? (
        <div className="m-auto p-8 text-center">
          <h2 className="text-xl">Your story starts with a question</h2>
          <p className="mt-3 opacity-60">
            Add a question in the builder to try your form.
          </p>
        </div>
      ) : completed ? (
        <div className="m-auto max-w-xl p-8 text-center">
          <Check size={40} className="mx-auto mb-6" />
          <h2 className="text-3xl">
            {definition.ending_settings?.title || "Thank you!"}
          </h2>
          <p className="mt-4 text-lg opacity-65">
            {preview
              ? "Preview complete. No response was collected."
              : definition.ending_settings?.description ||
                "Your response has been recorded."}
          </p>
          {preview && (
            <button
              className="mt-8 inline-flex items-center gap-2 rounded-lg border border-current px-4 py-2"
              onClick={() => {
                setCompleted(false);
                setPosition(0);
                setAnswers({});
                setError(null);
              }}
            >
              <RotateCcw size={16} />
              Restart preview
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-1 items-center px-6 py-12 @[600px]/flow:px-14">
            <section
              key={q.question_key}
              className={`question-transition mx-auto w-full max-w-[640px] ${direction < 0 ? "question-back" : ""}`}
            >
              <div className="mb-8 flex items-start gap-3">
                <span className="mt-1.5 flex shrink-0 items-center gap-1 text-sm text-[var(--answer-accent)]">
                  {position + 1}
                  <ArrowRight size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    ref={heading}
                    tabIndex={-1}
                    className="text-[24px] leading-[1.35] break-words outline-none @[600px]/flow:text-[30px]"
                  >
                    {q.title || "Your question goes here"}
                    {q.required && <span aria-label="required">*</span>}
                  </h2>
                  {q.description && (
                    <p className="mt-3 text-lg leading-7 whitespace-pre-wrap opacity-65">
                      {q.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="ml-8 text-[var(--answer-accent)]">
                <AnswerControl
                  question={q}
                  value={answers[q.question_key]}
                  onChange={answer}
                  invalid={!!error}
                />
                {error && (
                  <p
                    id={`error-${q.question_key}`}
                    role="alert"
                    className="mt-4 rounded bg-[#ffe8e5] px-3 py-2 text-sm text-[#a62318]"
                  >
                    {error}
                  </p>
                )}
                <div className="mt-7 hidden items-center gap-3 @[600px]/flow:flex">
                  <button
                    disabled={submitting || transitioning}
                    onClick={() => void advance()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--answer-accent)] px-5 py-2 font-medium text-white disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting…"
                      : position === questions.length - 1
                        ? preview
                          ? "Finish preview"
                          : "Submit"
                        : "OK"}
                    <Check size={18} />
                  </button>
                  <span className="text-xs opacity-65">
                    press <strong>Enter ↵</strong>
                  </span>
                </div>
                {q.type === "long_text" && (
                  <p className="mt-3 text-xs opacity-60">
                    Shift + Enter to add a new line
                  </p>
                )}
              </div>
            </section>
          </div>
          <footer
            className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-current/10 px-5 py-3"
            style={{
              backgroundColor: theme?.background ?? "#fff",
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
            }}
          >
            <span className="text-xs opacity-60">
              {position + 1} of {questions.length}
              {preview ? " · Preview" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!position || submitting || transitioning}
                aria-label="Previous question"
                onClick={() => move(position - 1)}
                className="flex size-10 items-center justify-center rounded-md border border-current/20 disabled:opacity-25"
              >
                <ArrowUp size={18} />
              </button>
              <button
                aria-label={
                  position === questions.length - 1
                    ? preview
                      ? "Finish preview"
                      : "Submit response"
                    : "Next question"
                }
                disabled={submitting || transitioning}
                onClick={() => void advance()}
                className="flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--answer-accent)] px-3 text-white disabled:opacity-50"
              >
                <span className="@[600px]/flow:hidden">
                  {position === questions.length - 1
                    ? preview
                      ? "Finish"
                      : "Submit"
                    : "OK"}
                </span>
                <ArrowDown size={18} />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
