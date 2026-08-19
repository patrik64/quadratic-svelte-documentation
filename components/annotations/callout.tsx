import { type AnnotationHandler, type InlineAnnotation } from 'codehike/code';

// `// !callout[/regex/] message` — speech-bubble note anchored under the match
export const callout: AnnotationHandler = {
  name: 'callout',
  transform: (annotation: InlineAnnotation) => {
    const { name, query, lineNumber, fromColumn, toColumn, data } = annotation;
    return {
      name,
      query,
      fromLineNumber: lineNumber,
      toLineNumber: lineNumber,
      data: { ...data, column: (fromColumn + toColumn) / 2 },
    };
  },
  Block: ({ annotation, children }) => {
    const { column } = annotation.data as { column: number };
    return (
      <>
        {children}
        <div
          style={{ minWidth: `${column + 4}ch` }}
          className="relative mt-1 -ml-[1ch] w-fit whitespace-break-spaces rounded border border-fd-primary/50 bg-fd-secondary px-2 text-fd-secondary-foreground"
        >
          <div
            style={{ left: `${column}ch` }}
            className="absolute -top-px h-2 w-2 -translate-y-1/2 rotate-45 border-t border-l border-fd-primary/50 bg-fd-secondary"
          />
          {annotation.query}
        </div>
      </>
    );
  },
};
