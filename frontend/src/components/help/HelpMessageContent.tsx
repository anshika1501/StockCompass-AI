"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function HelpMessageContent({
  content,
  variant,
}: {
  content: string;
  variant: "light" | "dark";
}) {
  /* react-markdown v9+ does not accept className on <ReactMarkdown /> — wrap a prose container instead */
  return (
    <div
      className={cn(
        "max-w-none text-sm leading-relaxed",
        variant === "light" && [
          "prose prose-slate prose-p:my-2 prose-headings:my-2 prose-headings:text-[#0f172a]",
          "prose-strong:text-[#0f172a] prose-ul:my-2 prose-li:my-0.5",
        ],
        variant === "dark" && [
          "prose-invert prose-p:text-slate-300 prose-p:my-2 prose-headings:my-2 prose-headings:text-white",
          "prose-strong:text-white prose-ul:my-2 prose-li:my-0.5 prose-hr:border-white/10",
        ]
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
