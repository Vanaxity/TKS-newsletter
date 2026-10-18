import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Article text. react-markdown ignores raw HTML, so nothing in an article can inject markup.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-5 text-lg leading-relaxed text-tks-black">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 className="mt-4 text-2xl font-semibold tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-2 text-xl font-semibold">{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="flex list-disc flex-col gap-2 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="flex list-decimal flex-col gap-2 pl-6">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          code: ({ children }) => <code className="rounded bg-tks-offwhite px-1.5 py-0.5 text-base">{children}</code>,
          blockquote: ({ children }) => <blockquote className="border-l-4 border-tks-green pl-4 text-tks-grey">{children}</blockquote>,
          a: ({ href, children }) => (
            <a href={href} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
