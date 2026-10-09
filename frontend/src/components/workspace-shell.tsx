"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  Blocks,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  Diamond,
  Gift,
  LayoutGrid,
  Mic,
  Microscope,
  PanelsTopLeft,
  Plus,
  Search,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type WorkspaceShellProps = {
  children: React.ReactNode;
  onCreate?: () => void;
  createRef?: React.Ref<HTMLButtonElement>;
  disabled?: boolean;
  search?: string;
  onSearch?: (value: string) => void;
  formCount?: number;
  responses?: number;
};

export function WorkspaceCover({ letter }: { letter?: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#ac5420]"
    >
      <span className="absolute -left-1 top-1 h-8 w-7 rounded-full bg-[#ce7b38]" />
      <span className="absolute -right-1 top-1 h-8 w-7 rounded-full bg-[#ce7b38]" />
      {letter && <span className="relative text-xl text-white">{letter}</span>}
    </span>
  );
}

const tabs = [
  { label: "Forms", Icon: PanelsTopLeft },
  { label: "Contacts", Icon: Users },
  { label: "Automations", Icon: Workflow },
  { label: "Insights", Icon: ChartNoAxesCombined },
  { label: "Pages", Icon: PanelsTopLeft },
  { label: "Research Flow", Icon: Microscope },
];

export function WorkspaceShell({
  children,
  onCreate,
  createRef,
  disabled,
  search = "",
  onSearch,
  formCount = 0,
  responses = 0,
}: WorkspaceShellProps) {
  const [banner, setBanner] = useState(true);
  const [section, setSection] = useState<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  function openSection(name: string) {
    returnFocus.current = document.activeElement as HTMLElement;
    setSection(name);
  }
  return (
    <div className="min-h-dvh bg-white text-[#514957]">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="flex h-20 items-center justify-between gap-4 px-5 sm:px-6">
        <button
          onClick={() => openSection("Demo account")}
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Demo account information"
        >
          <span
            className="h-10 w-3.5 rounded-full bg-[#191919]"
            aria-hidden="true"
          />
          <WorkspaceCover letter="D" />
          <span className="truncate text-base font-medium">Demo account</span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-5 lg:gap-10">
          <button
            onClick={() => openSection("Integrations")}
            className="hidden items-center gap-2 text-base md:flex"
          >
            <Blocks size={21} />
            Integrations
          </button>
          <button
            onClick={() => openSection("Brand kit")}
            className="hidden items-center gap-2 text-base md:flex"
          >
            <Gift size={22} />
            Brand kit
          </button>
          <button
            aria-label="Help"
            onClick={() => openSection("About this demo")}
          >
            <CircleHelp size={21} />
          </button>
          <button
            aria-label="Demo creator"
            onClick={() => openSection("Demo account")}
            className="flex size-10 items-center justify-center rounded-full bg-[#f6d49b] text-sm"
          >
            D
          </button>
        </div>
      </header>
      {banner && (
        <div className="relative mx-3 mt-2 flex min-h-[70px] flex-wrap items-center justify-center gap-3 rounded-2xl border border-[#9bcfc7] bg-[#f6fbfa] px-5 py-4 pr-12 shadow-[0_0_0_2px_#edf6f4] sm:mx-5 sm:gap-4">
          <Diamond
            size={24}
            className="shrink-0 text-[#137e70]"
            aria-hidden="true"
          />
          <p className="text-center text-sm sm:text-lg">
            Create forms and collect responses in your{" "}
            <strong className="font-semibold">private workspace.</strong>
          </p>
          <button
            onClick={() => openSection("About this demo")}
            className="rounded-lg bg-[#197c6b] px-3 py-1.5 text-sm font-semibold text-white"
          >
            Explore workspace
          </button>
          <button
            aria-label="Dismiss workspace banner"
            onClick={() => setBanner(false)}
            className="absolute right-5 top-1/2 -translate-y-1/2"
          >
            <X size={23} />
          </button>
        </div>
      )}
      <div
        className={`mx-3 mt-4 mb-5 overflow-hidden rounded-2xl bg-[#f7f7f8] sm:mx-5 ${banner ? "min-h-[calc(100dvh-194px)]" : "min-h-[calc(100dvh-116px)]"}`}
      >
        <nav
          aria-label="Application navigation"
          className="flex h-[74px] items-center gap-1 overflow-x-auto border-b-2 border-white px-4 whitespace-nowrap lg:gap-2"
        >
          {tabs.map(({ label, Icon }) => (
            <button
              key={label}
              onClick={() => label !== "Forms" && openSection(label)}
              aria-current={label === "Forms" ? "page" : undefined}
              className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-base ${label === "Forms" ? "bg-[#ececef] font-medium after:absolute after:-bottom-[15px] after:right-4 after:left-4 after:h-1 after:rounded-full after:bg-[#514957]" : "hover:bg-[#ececef]"} ${label === "Research Flow" ? "ml-4 border-l border-[#dfdce2] pl-7" : ""}`}
            >
              <Icon size={21} aria-hidden="true" />
              {label}
              {label === "Insights" && (
                <span className="rounded-full border border-[#b9e4dc] p-1 text-[#087c6a]">
                  <Diamond size={17} />
                </span>
              )}
              {label === "Pages" && (
                <span className="rounded-lg border border-[#bfdbfe] px-2 py-0.5 text-xs text-[#246bcc]">
                  Beta
                </span>
              )}
            </button>
          ))}
        </nav>
        <div
          className={`flex flex-col md:flex-row ${banner ? "md:h-[calc(100dvh-268px)] md:min-h-[420px]" : "md:h-[calc(100dvh-190px)] md:min-h-[420px]"}`}
        >
          <aside
            aria-label="Workspace navigation"
            className="flex shrink-0 flex-col border-b-2 border-white md:w-[280px] md:overflow-y-auto md:border-r-2 md:border-b-0 2xl:w-80"
          >
            <div className="px-5 py-5">
              <button
                ref={createRef}
                onClick={onCreate}
                disabled={disabled || !onCreate}
                aria-label="Create a form"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-[#3c323f] text-base font-semibold text-white hover:bg-[#514456] disabled:opacity-50"
              >
                <Plus size={20} />
                Create form
              </button>
            </div>
            <label className="flex h-[76px] items-center gap-3 border-y-2 border-white px-8">
              <Search
                size={22}
                className="shrink-0 text-[#6d6573]"
                aria-hidden="true"
              />
              <input
                aria-label="Search forms"
                placeholder="Search"
                value={search}
                onChange={(event) => onSearch?.(event.target.value)}
                disabled={!onSearch}
                className="min-w-0 w-full bg-transparent text-base outline-offset-4 placeholder:text-[#6d6573]"
              />
            </label>
            <div className="hidden flex-1 px-5 pt-6 md:block">
              <div className="mb-6 flex items-center justify-between px-4">
                <span className="flex items-center gap-3 text-base font-medium">
                  <LayoutGrid size={20} />
                  Workspaces
                </span>
                <button
                  aria-label="Add workspace"
                  onClick={() => openSection("Additional workspaces")}
                  className="flex size-10 items-center justify-center rounded-xl border border-[#e2dfe4] bg-white"
                >
                  <Plus size={21} />
                </button>
              </div>
              <div className="mb-5 flex items-center justify-between px-4 text-sm font-medium">
                Private
                <ChevronDown size={16} className="rotate-180" />
              </div>
              <button
                aria-current="page"
                className="flex w-full items-center justify-between rounded-xl bg-[#ececef] px-4 py-3 text-sm"
              >
                <span>My workspace</span>
                <span>{formCount}</span>
              </button>
            </div>
            <div className="hidden border-t-2 border-white px-5 py-6 md:block">
              <p className="text-sm">Responses collected</p>
              <div className="mt-2 h-1 rounded-full bg-[#dfdce1]" />
              <p className="mt-2 text-lg">
                {responses}
                <span className="ml-2 text-xs text-[#766e7c]">
                  from loaded forms
                </span>
              </p>
              <p className="mt-5 text-xs leading-5 text-[#766e7c]">
                Private to this browser. Sample responses are synthetic.
              </p>
            </div>
            <div className="hidden border-t-2 border-white p-2 md:block">
              <button
                onClick={() => openSection("Typeform AI")}
                className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-[#e9cdff] bg-white p-3 text-[#766e7c] shadow-[0_0_0_3px_#eeecef]"
              >
                <span className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-[#d9b4f7] px-3">
                  <Mic size={22} />
                  <span className="flex-1 border-l border-[#eeecef] pl-3 text-left text-sm">
                    Ask Typeform AI
                  </span>
                  <ArrowRight
                    size={21}
                    className="rounded-md bg-[#f7f7f8] p-0.5 text-[#b5aebb]"
                  />
                </span>
              </button>
            </div>
          </aside>
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 md:overflow-y-auto"
          >
            {children}
          </main>
        </div>
      </div>
      <Dialog
        open={!!section}
        onOpenChange={(open) => !open && setSection(null)}
      >
        <DialogContent
          title={section ?? "About this demo"}
          description={
            section === "About this demo" || section === "Demo account"
              ? "This assignment demo gives each browser its own workspace. Public forms can be answered without logging in. There is no subscription or response quota."
              : "Coming soon. This section is a placeholder outside the core form creation, publishing, and response workflows."
          }
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <button
            onClick={() => setSection(null)}
            className="mt-5 rounded-lg bg-[#3c323f] px-4 py-2 text-sm font-medium text-white"
          >
            Got it
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
