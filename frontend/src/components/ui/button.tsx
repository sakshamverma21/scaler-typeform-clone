import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary: "bg-text text-white hover:bg-[#443a45]",
  danger: "bg-[var(--danger)] text-white hover:bg-[#8b1c12]",
  secondary: "border border-border bg-surface text-text hover:bg-surface-muted",
  ghost: "text-text-muted hover:bg-surface-muted hover:text-text",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className = "", variant = "primary", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-45 ${variants[variant]} ${className}`}
        {...props}
      />
    );
  },
);
