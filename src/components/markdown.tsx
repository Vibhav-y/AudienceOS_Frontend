"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Lightweight, dark-theme markdown renderer tuned for chat replies.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-7 text-neutral-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-100">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-1 space-y-1.5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1.5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 [ol_&]:list-item">
              <span className="mt-2.5 hidden h-1 w-1 shrink-0 rounded-full bg-neutral-600 [ul_&]:block" />
              <span>{children}</span>
            </li>
          ),
          h1: ({ children }) => <h3 className="mb-2 mt-1 text-base font-semibold text-neutral-100">{children}</h3>,
          h2: ({ children }) => <h3 className="mb-2 mt-1 text-base font-semibold text-neutral-100">{children}</h3>,
          h3: ({ children }) => <h3 className="mb-2 mt-1 text-sm font-semibold text-neutral-300">{children}</h3>,
          code: ({ children }) => (
            <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[13px] text-orange-300">{children}</code>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-orange-400 underline underline-offset-2">{children}</a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
