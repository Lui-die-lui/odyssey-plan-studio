"use client";

import React from "react";

export type StatusMessageVariant = "loading" | "error" | "empty";

export type StatusMessageProps = {
  variant: StatusMessageVariant;
  title: string;
  description?: string;
  /**
   * Extra CSS classes for the outer container.
   */
  className?: string;
};

const StatusMessage = ({
  variant,
  title,
  description,
  className,
}: StatusMessageProps) => {
  const { containerClassName, textClassName } =
    variant === "loading"
      ? {
          containerClassName:
            "border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black",
          textClassName: "text-zinc-600 dark:text-zinc-300",
        }
      : variant === "error"
        ? {
            containerClassName:
              "border border-red-400/30 bg-red-50 p-4 dark:bg-black/20 dark:border-red-400/20",
            textClassName: "text-red-700 dark:text-red-300",
          }
        : {
            containerClassName:
              "border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black",
            textClassName: "text-zinc-600 dark:text-zinc-400",
          };

  const titleElement = (
    <p className={`font-medium ${textClassName}`}>{title}</p>
  );

  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={`${containerClassName} ${textClassName} ${className ?? ""}`}
    >
      {titleElement}
      {description ? (
        <p className={`mt-1 text-sm ${textClassName}`}>{description}</p>
      ) : null}
    </div>
  );
};

export default StatusMessage;

