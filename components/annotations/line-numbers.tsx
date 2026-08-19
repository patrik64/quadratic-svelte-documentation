import { type AnnotationHandler, InnerLine } from 'codehike/code';

// enabled with the `-n` flag in the code fence meta
export const lineNumbers: AnnotationHandler = {
  name: 'line-numbers',
  Line: (props) => {
    const width = props.totalLines.toString().length + 1;
    return (
      <div className="flex">
        <span
          style={{ minWidth: `${width}ch` }}
          className="select-none text-right opacity-50"
        >
          {props.lineNumber}
        </span>
        <InnerLine merge={props} className="flex-1 pl-2" />
      </div>
    );
  },
};
