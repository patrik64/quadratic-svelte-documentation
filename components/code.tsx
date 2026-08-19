'use client';

import { type HighlightedCode, Pre } from 'codehike/code';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { callout } from './annotations/callout';
import { diff } from './annotations/diff';
import { lineNumbers } from './annotations/line-numbers';
import { mark } from './annotations/mark';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
      aria-label="Copy to clipboard"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

// All MDX code fences render through this component (see `components.code`
// in the Code Hike config). The codeblock arrives already highlighted at
// compile time, so no async work happens here.
export function Code({ codeblock }: { codeblock: HighlightedCode }) {
  const flags = codeblock.meta.split(' ').filter(Boolean);
  const filename = flags.find((f) => f.includes('.'));
  const showLineNumbers = flags.includes('-n');

  const handlers = [callout, diff, mark];
  if (showLineNumbers) handlers.push(lineNumbers);

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border bg-[var(--ch-16)]">
      <div className="flex items-center gap-2 border-b bg-fd-secondary/50 px-3 py-1.5">
        <span className="flex-1 font-mono text-xs text-fd-muted-foreground">
          {filename ?? codeblock.lang}
        </span>
        <CopyButton text={codeblock.code} />
      </div>
      <Pre
        code={codeblock}
        handlers={handlers}
        className="m-0 overflow-auto px-3 py-3 text-[13px] leading-6"
      />
    </div>
  );
}
