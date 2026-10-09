"use client";
import { useState } from "react";
import {
  Search,
  CreditCard,
  Upload,
  CalendarDays,
  LayoutList,
  Blocks,
  Contact,
  Phone,
  MapPin,
  Link,
  Image,
  Scale,
  CheckSquare,
  BarChart3,
  ListOrdered,
  Grid3X3,
  Video,
  Sparkles,
  PenLine,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  questionTypes,
  type QuestionType,
} from "@/components/questions/registry";

type Placeholder = { label: string; Icon: typeof Search };
const extra: Record<string, Placeholder[]> = {
  Contact: [
    { label: "Contact Info", Icon: Contact },
    { label: "Phone Number", Icon: Phone },
    { label: "Address", Icon: MapPin },
    { label: "Website", Icon: Link },
  ],
  Choice: [
    { label: "Picture Choice", Icon: Image },
    { label: "Legal", Icon: Scale },
    { label: "Checkbox", Icon: CheckSquare },
  ],
  Rating: [
    { label: "Net Promoter Score", Icon: BarChart3 },
    { label: "Opinion Scale", Icon: BarChart3 },
    { label: "Ranking", Icon: ListOrdered },
    { label: "Matrix", Icon: Grid3X3 },
  ],
  Text: [
    { label: "Video and Audio", Icon: Video },
    { label: "Clarify with AI", Icon: Sparkles },
    { label: "FAQ with AI", Icon: MessageSquare },
  ],
  Other: [
    { label: "Date", Icon: CalendarDays },
    { label: "Signature", Icon: PenLine },
    { label: "Payment", Icon: CreditCard },
    { label: "File upload", Icon: Upload },
    { label: "Scheduler", Icon: CalendarDays },
  ],
};
const headings: Record<string, string> = {
  Contact: "Contact info",
  Choice: "Choice",
  Rating: "Rating & ranking",
  Text: "Text & Video",
  Other: "Other",
};
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
  const matches = (label: string) =>
    label.toLowerCase().includes(search.toLowerCase());
  function placeholder({ label, Icon }: Placeholder, color = "bg-[#ddd9df]") {
    return (
      <button
        key={label}
        disabled
        title={`${label} — Coming soon`}
        className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-[#7b7380] disabled:cursor-default"
      >
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${color}`}
        >
          <Icon size={19} />
        </span>
        <span>
          {label}
          <span className="ml-2 text-[10px] text-[#a29aa8]">Coming soon</span>
        </span>
      </button>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title="Add form elements"
        description="Choose a question type. Additional elements are marked Coming soon."
        hideHeading
        className="max-w-[1200px]! rounded-[22px]! bg-[#f7f7f8]! p-0!"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onClosed();
        }}
      >
        <div className="flex min-h-[70px] items-center gap-4 overflow-x-auto px-5 pr-14 text-sm sm:px-8">
          <span className="shrink-0 rounded-xl border-2 border-[#514957] px-4 py-2 font-medium">
            Add form elements
          </span>
          <button
            disabled
            title="Coming soon"
            className="shrink-0 px-1 text-[#807785]"
          >
            Import questions <span className="text-[10px]">Coming soon</span>
          </button>
          <button
            disabled
            title="Coming soon"
            className="shrink-0 px-1 text-[#807785]"
          >
            Create with AI <span className="text-[10px]">Coming soon</span>
          </button>
        </div>
        <div className="mx-3 mb-3 rounded-2xl bg-white p-5 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside>
              <label className="flex h-10 items-center gap-2 rounded-xl border border-[#e2dfe4] bg-[#fafafa] px-3">
                <Search size={20} className="shrink-0 text-text-muted" />
                <input
                  aria-label="Search question types"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search form elements"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <div className="mt-8 hidden lg:block">
                <h3 className="mb-3 px-2 text-sm font-medium">Recommended</h3>
                {placeholder({ label: "Welcome Screen", Icon: LayoutList })}
                <h3 className="mt-5 mb-3 px-2 text-sm font-medium">
                  Connect to apps
                </h3>
                {["HubSpot", "Salesforce", "Browse all apps"].map((label) => (
                  <div
                    key={label}
                    className="mb-2 rounded-xl border border-[#ece9ef]"
                  >
                    {placeholder({ label, Icon: Blocks })}
                  </div>
                ))}
              </div>
            </aside>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
              {["Contact", "Choice", "Rating", "Text", "Other"].map((group) => (
                <section key={group}>
                  <h3 className="mb-3 px-2 text-sm font-semibold">
                    {headings[group]}
                  </h3>
                  {types
                    .filter(
                      ([, item]) => item.group === group && matches(item.label),
                    )
                    .map(([type, { label, icon: Icon, color }]) => (
                      <button
                        key={type}
                        onClick={() => {
                          choose(type);
                          setOpen(false);
                          setSearch("");
                        }}
                        className="flex min-h-12 w-full items-center gap-3 rounded-lg px-2 text-left text-base text-[#6d6573] hover:bg-[#f4f2f6]"
                      >
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${color}`}
                        >
                          <Icon size={19} />
                        </span>
                        {label}
                      </button>
                    ))}
                  {extra[group]
                    ?.filter((item) => matches(item.label))
                    .map((item) =>
                      placeholder(
                        item,
                        group === "Contact"
                          ? "bg-[#f5cedc]"
                          : group === "Choice"
                            ? "bg-[#dfd2f6]"
                            : group === "Rating"
                              ? "bg-[#c7e5be]"
                              : group === "Text"
                                ? "bg-[#c5e3f7]"
                                : "bg-[#ffe39b]",
                      ),
                    )}
                </section>
              ))}
              <section>
                <h3 className="mb-3 px-2 text-sm font-semibold">
                  Screens & endings
                </h3>
                {[
                  { label: "Welcome Screen", Icon: LayoutList },
                  { label: "Statement", Icon: MessageSquare },
                  { label: "Question Group", Icon: LayoutList },
                  { label: "End Screen", Icon: LayoutList },
                  { label: "Redirect to URL", Icon: ArrowRight },
                ]
                  .filter((item) => matches(item.label))
                  .map((item) => placeholder(item))}
                <p className="mt-4 px-2 text-xs leading-5 text-text-muted">
                  Your form already includes a working default thank-you screen.
                </p>
              </section>
            </div>
          </div>
          {search && !types.some(([, item]) => matches(item.label)) && (
            <p className="mt-6 text-sm text-text-muted">
              No supported question types match your search.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
