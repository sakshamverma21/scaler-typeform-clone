import {
  AlignLeft,
  Text,
  List,
  ChevronDown,
  Mail,
  Hash,
  Check,
  Star,
} from "lucide-react";
import type { DraftDefinition } from "@/lib/api/forms";

export type Question = NonNullable<DraftDefinition["questions"]>[number];
export type QuestionType = Question["type"];
export type Answer = string | number | boolean | null;

export const questionTypes = {
  short_text: {
    label: "Short text",
    icon: Text,
    color: "bg-[#c5e3f7]",
    group: "Text",
  },
  long_text: {
    label: "Long text",
    icon: AlignLeft,
    color: "bg-[#c5e3f7]",
    group: "Text",
  },
  email: {
    label: "Email",
    icon: Mail,
    color: "bg-[#f5cedc]",
    group: "Contact",
  },
  multiple_choice: {
    label: "Multiple choice",
    icon: List,
    color: "bg-[#dfd2f6]",
    group: "Choice",
  },
  dropdown: {
    label: "Dropdown",
    icon: ChevronDown,
    color: "bg-[#dfd2f6]",
    group: "Choice",
  },
  yes_no: {
    label: "Yes / No",
    icon: Check,
    color: "bg-[#dfd2f6]",
    group: "Choice",
  },
  number: {
    label: "Number",
    icon: Hash,
    color: "bg-[#fae3a5]",
    group: "Other",
  },
  rating: {
    label: "Rating",
    icon: Star,
    color: "bg-[#cbe7b7]",
    group: "Rating",
  },
} as const;

export function newQuestion(type: QuestionType): Question {
  return {
    question_key: crypto.randomUUID(),
    type,
    title: "",
    description: "",
    required: false,
    rating_max: type === "rating" ? 5 : null,
    options:
      type === "multiple_choice" || type === "dropdown"
        ? ["Choice 1", "Choice 2"].map((label) => ({
            option_key: crypto.randomUUID(),
            label,
          }))
        : [],
  };
}

export const hasAnswer = (value: Answer | undefined) =>
  value !== null &&
  value !== undefined &&
  !(typeof value === "string" && !value.trim());

export function validEmail(value: string) {
  if (value.length > 254 || value.split("@").length !== 2) return false;
  const [local, rawDomain] = value.split("@");
  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.\-]+$/.test(local)
  )
    return false;
  let domain: string;
  try {
    domain = new URL(`http://${rawDomain}`).hostname;
  } catch {
    return false;
  }
  if (/[\s/:?#@]/.test(rawDomain)) return false;
  const labels = domain.split(".");
  return (
    labels.length >= 2 &&
    labels.every((label) =>
      /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label),
    )
  );
}

export function validateAnswer(
  q: Question,
  value: Answer | undefined,
): string | null {
  if (!hasAnswer(value)) return q.required ? "Please fill this in." : null;
  if (q.type === "short_text" || q.type === "long_text" || q.type === "email") {
    if (typeof value !== "string") return "Enter a text answer.";
    const text = value.trim();
    const max =
      q.type === "short_text" ? 999 : q.type === "long_text" ? 10000 : 254;
    if (Array.from(text).length > max) return `Use at most ${max} characters.`;
    if (q.type === "short_text" && /[\r\n]/.test(text))
      return "Use a single line of text.";
    if (q.type === "email" && !validEmail(text))
      return "Enter a valid email address.";
  } else if (q.type === "multiple_choice" || q.type === "dropdown") {
    if (!(q.options ?? []).some((o) => o.option_key === value))
      return "Select a choice from this question.";
  } else if (q.type === "yes_no") {
    if (typeof value !== "boolean") return "Choose Yes or No.";
  } else {
    const max = q.type === "rating" ? (q.rating_max ?? 5) : 999999999999999;
    const min = q.type === "rating" ? 1 : 0;
    const numeric =
      q.type === "number" &&
      typeof value === "string" &&
      /^\d+$/.test(value.trim())
        ? Number(value)
        : value;
    if (
      typeof numeric !== "number" ||
      !Number.isInteger(numeric) ||
      numeric < min ||
      numeric > max
    )
      return `Enter a whole number from ${min} to ${max}.`;
  }
  return null;
}

export function normalizedAnswer(
  q: Question,
  value: Answer | undefined,
): Answer {
  if (!hasAnswer(value)) return null;
  if (q.type === "number" && typeof value === "string")
    return Number(value.trim());
  return typeof value === "string" ? value.trim() : (value ?? null);
}
