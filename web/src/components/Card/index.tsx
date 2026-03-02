import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  "aria-label"?: string;
  "aria-describedby"?: string;
  role?: string;
  tabIndex?: number;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className = "",
  interactive = false,
  padding = "md",
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  role,
  tabIndex,
}: CardProps) {
  const baseClasses = [
    "bg-slate-800",
    "backdrop-blur-sm",

    "border",
    "border-slate-700",

    "rounded-xl",

    "shadow-lg",
  ];

  const interactiveClasses = interactive
    ? [
        "card-interactive",
        "cursor-pointer",
        "focus-ring",
        "hover:bg-slate-800/90",
        "hover:border-slate-600",
      ]
    : [];

  const paddingClass = paddingMap[padding];

  const allClasses = [
    ...baseClasses,
    ...interactiveClasses,
    paddingClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={allClasses}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      role={role}
      tabIndex={interactive ? (tabIndex ?? 0) : tabIndex}
    >
      {children}
    </div>
  );
}

export default Card;
