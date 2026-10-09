"use client";

import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { GripVertical, Plus, Check } from "lucide-react";
import { questionTypes, type Question } from "@/components/questions/registry";

export function TypeBadge({
  question,
  number,
}: {
  question: Question;
  number?: number;
}) {
  const { icon: Icon, color } = questionTypes[question.type];
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-2 rounded-md px-2 text-xs text-[#342c38] ${color}`}
    >
      <Icon size={15} aria-hidden="true" />
      {number}
    </span>
  );
}

function QuestionRow({
  question,
  index,
  selected,
  onSelect,
}: {
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: question.question_key,
    index,
  });
  return (
    <li
      ref={ref}
      data-testid="question-row"
      data-question-key={question.question_key}
      className={`mb-2 flex min-h-14 items-center rounded-lg border p-1 transition-colors ${selected ? "border-[#dbd8dd] bg-[#eeedef]" : "border-transparent hover:bg-white/70"} ${isDragging ? "shadow-lg opacity-60" : ""} ${isDropTarget ? "ring-1 ring-[#b6acbd]" : ""}`}
    >
      <button
        ref={handleRef}
        aria-label={`Reorder question ${index + 1}`}
        title="Drag to reorder; Space then arrows for keyboard"
        className="flex min-h-10 w-5 shrink-0 touch-none items-center justify-center text-text-muted"
      >
        <GripVertical size={14} />
      </button>
      <button
        onClick={onSelect}
        aria-current={selected ? "step" : undefined}
        aria-label={`Edit question ${index + 1}: ${question.title || questionTypes[question.type].label}`}
        className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded px-1 text-left"
      >
        <TypeBadge question={question} number={index + 1} />
        <span className="line-clamp-2 min-w-0 text-xs leading-4 break-words">
          {question.title || questionTypes[question.type].label}
        </span>
      </button>
    </li>
  );
}

export function QuestionList({
  questions,
  selected,
  select,
  reorder,
  add,
  ending,
}: {
  questions: Question[];
  selected: string | null;
  select: (key: string) => void;
  reorder: (keys: string[]) => void;
  add: () => void;
  ending: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-surface-muted p-3">
        <div className="mb-4 flex items-center justify-between px-2 pt-2">
          <h2 className="text-xs font-medium">Questions</h2>
          <span className="text-xs text-text-muted">
            {questions.length}/100
          </span>
        </div>
        <DragDropProvider
          onDragEnd={(event) => {
            if (!event.canceled)
              reorder(
                move(
                  questions.map((q) => q.question_key),
                  event,
                ),
              );
          }}
        >
          <ol aria-label="Form questions">
            {questions.map((question, index) => (
              <QuestionRow
                key={question.question_key}
                question={question}
                index={index}
                selected={selected === question.question_key}
                onSelect={() => select(question.question_key)}
              />
            ))}
          </ol>
        </DragDropProvider>
        {!questions.length && (
          <p className="px-2 py-5 text-xs leading-5 text-text-muted">
            Start with a question. Make it yours.
          </p>
        )}
        <button
          onClick={add}
          disabled={questions.length >= 100}
          className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs hover:bg-white disabled:opacity-40"
        >
          <Plus size={15} />
          Add question
        </button>
      </div>
      <div className="rounded-xl bg-surface-muted p-4">
        <h2 className="mb-3 text-xs font-medium">Endings</h2>
        <button
          onClick={ending}
          className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs"
        >
          <span className="flex size-6 items-center justify-center rounded bg-[#cbe7b7]">
            <Check size={14} />
          </span>
          Thank you screen
        </button>
      </div>
    </div>
  );
}
