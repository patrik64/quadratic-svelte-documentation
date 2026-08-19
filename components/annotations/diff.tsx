import { type AnnotationHandler, type BlockAnnotation, InnerLine } from 'codehike/code';
import { mark } from './mark';

// `// !diff +` / `// !diff -` — GitHub-style added/removed lines
export const diff: AnnotationHandler = {
  name: 'diff',
  onlyIfAnnotated: true,
  transform: (annotation: BlockAnnotation) => {
    const color = annotation.query == '-' ? '#f85149' : '#3fb950';
    return [annotation, { ...annotation, name: 'mark', query: color }];
  },
  Line: ({ annotation, ...props }) => (
    <>
      <div className="box-content min-w-[1ch] select-none pl-2 opacity-70">
        {annotation?.query}
      </div>
      <InnerLine merge={props} />
    </>
  ),
};

export const diffHandlers: AnnotationHandler[] = [diff, mark];
