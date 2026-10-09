import type { DraftDefinition } from "@/lib/api/forms";
import {
  newQuestion,
  type Question,
  type QuestionType,
} from "@/components/questions/registry";

export type BuilderAction =
  | { type: "title"; title: string }
  | { type: "add"; question: Question; after?: string }
  | { type: "edit"; key: string; patch: Partial<Question> }
  | { type: "change-type"; key: string; questionType: QuestionType }
  | { type: "delete"; key: string }
  | { type: "reorder"; keys: string[] };

export function draftReducer(
  draft: DraftDefinition,
  action: BuilderAction,
): DraftDefinition {
  const questions = draft.questions ?? [];
  switch (action.type) {
    case "title":
      return { ...draft, title: action.title };
    case "add": {
      if (questions.length >= 100) return draft;
      const next = [...questions];
      const at = action.after
        ? questions.findIndex((q) => q.question_key === action.after) + 1
        : next.length;
      next.splice(at, 0, action.question);
      return { ...draft, questions: next };
    }
    case "edit":
      return {
        ...draft,
        questions: questions.map((q) =>
          q.question_key === action.key
            ? { ...q, ...action.patch, question_key: q.question_key }
            : q,
        ),
      };
    case "change-type":
      return {
        ...draft,
        questions: questions.map((q) => {
          if (q.question_key !== action.key || q.type === action.questionType)
            return q;
          const defaults = newQuestion(action.questionType);
          const bothChoices =
            ["multiple_choice", "dropdown"].includes(q.type) &&
            ["multiple_choice", "dropdown"].includes(action.questionType);
          return {
            ...q,
            type: action.questionType,
            rating_max: defaults.rating_max,
            options: bothChoices ? q.options : defaults.options,
          };
        }),
      };
    case "delete":
      return {
        ...draft,
        questions: questions.filter((q) => q.question_key !== action.key),
      };
    case "reorder": {
      if (
        action.keys.length !== questions.length ||
        new Set(action.keys).size !== questions.length
      )
        return draft;
      const byKey = new Map(questions.map((q) => [q.question_key, q]));
      if (action.keys.some((key) => !byKey.has(key))) return draft;
      return { ...draft, questions: action.keys.map((key) => byKey.get(key)!) };
    }
  }
}
