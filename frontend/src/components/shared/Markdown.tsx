import ReactMarkdown from "react-markdown";

/** Renders markdown as styled HTML. react-markdown doesn't render raw HTML
 * by default, so this is safe against injected scripts/tags out of the box. */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: (props) => <h1 className="mb-2 mt-4 text-lg font-semibold first:mt-0" {...props} />,
        h2: (props) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0" {...props} />,
        h3: (props) => <h3 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0" {...props} />,
        p: (props) => <p className="mb-3 text-sm leading-relaxed last:mb-0" {...props} />,
        ul: (props) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm last:mb-0" {...props} />,
        ol: (props) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm last:mb-0" {...props} />,
        li: (props) => <li className="leading-relaxed" {...props} />,
        a: (props) => (
          <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...props} />
        ),
        code: (props) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs" {...props} />
        ),
        blockquote: (props) => (
          <blockquote className="mb-3 border-l-2 border-border pl-3 text-sm text-muted-foreground last:mb-0" {...props} />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
