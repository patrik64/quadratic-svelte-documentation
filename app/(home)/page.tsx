import Link from 'next/link';
import { GITHUB_REPO, LIVE_APP } from '@/lib/github';

const highlights = [
  {
    title: 'Mirrored file tree',
    body: 'The sidebar is the project tree — src/, quadratic-core/ and scripts/, one documentation page per source file.',
  },
  {
    title: 'Scrollycoding walkthroughs',
    body: 'Key files are explained step by step with a scroll-driven code panel and animated token transitions, powered by Code Hike.',
  },
  {
    title: 'Straight to the source',
    body: 'Every page embeds the full, syntax-highlighted file and links to the exact file on GitHub.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="mb-4 max-w-2xl text-4xl font-bold tracking-tight">
        The quadratic-svelte codebase documentation
      </h1>
      <p className="mb-8 max-w-xl text-fd-muted-foreground">
        Annotated source documentation for{' '}
        <a href={GITHUB_REPO} className="font-medium underline" target="_blank" rel="noreferrer noopener">
          quadratic-svelte
        </a>
        , a SvelteKit reimplementation of the Quadratic spreadsheet — infinite
        grid, formulas, JavaScript and Python cells.
      </p>
      <div className="mb-14 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/docs"
          className="rounded-full bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Browse the docs
        </Link>
        <Link
          href="/docs/src/lib/core/a1.ts"
          className="rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          Start with a walkthrough
        </Link>
        <a
          href={LIVE_APP}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
        >
          Open the live app ↗
        </a>
      </div>
      <div className="grid max-w-4xl gap-4 text-left sm:grid-cols-3">
        {highlights.map((h) => (
          <div key={h.title} className="rounded-xl border bg-fd-card p-5">
            <h2 className="mb-2 font-semibold">{h.title}</h2>
            <p className="text-sm text-fd-muted-foreground">{h.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
