'use client';

import { Block, HighlightedCodeBlock } from 'codehike/blocks';
import { type HighlightedCode, Pre } from 'codehike/code';
import type { ReactNode } from 'react';
import { Selectable, Selection, SelectionProvider } from 'codehike/utils/selection';
import { z } from 'zod';
import { callout } from './annotations/callout';
import { mark } from './annotations/mark';
import { tokenTransitions } from './annotations/token-transitions';

// like codehike's Block schemas, but tolerating absent children: under zod 4,
// Block's `children: z.custom()` rejects undefined, which breaks blocks whose
// content lives entirely inside their `## !!steps` sections
const Schema = z.object({
  steps: z.array(Block.partial().extend({ code: HighlightedCodeBlock })),
});

// explicit because codehike's zod-derived types don't survive this repo's TS setup
interface Step {
  title?: string;
  children?: ReactNode;
  code: HighlightedCode;
}

interface ScrollycodingProps {
  steps: Step[];
}

function StepCode({ code, className }: { code: HighlightedCode; className?: string }) {
  return (
    <Pre
      code={code}
      handlers={[tokenTransitions, callout, mark]}
      className={`m-0 px-4 py-4 text-[13px] leading-6 ${className ?? ''}`}
    />
  );
}

// Code Hike's scrollycoding pattern: the MDX children are split into
// `## !!steps` blocks; scrolling (or clicking) a step swaps the sticky code
// panel, animating tokens between versions.
export function Scrollycoding(props: unknown) {
  // codehike's parseProps error reporting crashes under zod 4, so validate directly
  const parsed = Schema.safeParse(props);
  if (!parsed.success) {
    throw new Error(`Scrollycoding: invalid MDX block structure — ${parsed.error.message}`);
  }
  const { steps } = parsed.data as ScrollycodingProps;

  return (
    <SelectionProvider className="my-8 flex gap-6">
      <div className="mb-[40vh] flex-1">
        {steps.map((step, i) => (
          <Selectable
            key={i}
            index={i}
            selectOn={['click', 'scroll']}
            className="mb-32 rounded-r border-l-4 border-fd-border bg-fd-card px-5 py-3 data-[selected=true]:border-fd-primary"
          >
            <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
            <div>{step.children}</div>
            <div className="mt-4 overflow-hidden rounded-lg border bg-[var(--ch-16)] lg:hidden">
              <StepCode code={step.code} className="overflow-auto" />
            </div>
          </Selectable>
        ))}
      </div>
      <div className="hidden w-[45%] max-w-2xl lg:block">
        <div className="sticky top-20 overflow-hidden rounded-lg border bg-[var(--ch-16)]">
          <div className="max-h-[calc(100vh-7rem)] overflow-auto">
            <Selection
              from={steps.map((step, i) => (
                <StepCode key={i} code={step.code} className="min-h-[32rem]" />
              ))}
            />
          </div>
        </div>
      </div>
    </SelectionProvider>
  );
}
