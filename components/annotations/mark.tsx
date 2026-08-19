import { type AnnotationHandler, InnerLine } from 'codehike/code';

// `// !mark` or `// !mark(1:3) gold` — highlights lines
// `!mark[/regex/]` — highlights inline matches
export const mark: AnnotationHandler = {
  name: 'mark',
  Line: ({ annotation, ...props }) => {
    const color = annotation?.query || 'rgb(14 165 233)';
    return (
      <div
        style={{
          borderLeft: 'solid 2px transparent',
          borderLeftColor: annotation ? color : undefined,
          backgroundColor: annotation ? `rgb(from ${color} r g b / 0.13)` : undefined,
        }}
        className="flex"
      >
        <InnerLine merge={props} className="flex-1 px-3" />
      </div>
    );
  },
  Inline: ({ annotation, children }) => {
    const color = annotation?.query || 'rgb(14 165 233)';
    return (
      <span
        className="-mx-0.5 rounded px-0.5 py-0"
        style={{
          outline: `solid 1px rgb(from ${color} r g b / 0.5)`,
          background: `rgb(from ${color} r g b / 0.13)`,
        }}
      >
        {children}
      </span>
    );
  },
};
