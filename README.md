# quadratic-svelte documentation

Annotated source documentation for [quadratic-svelte](https://github.com/patrik64/quadratic-svelte),
built with Next.js, [fumadocs](https://fumadocs.dev) and [Code Hike](https://codehike.org).

The sidebar mirrors the project's file tree — one page per source file, each a
**scrollycoding walkthrough**: a scroll-driven code panel with animated token
transitions, explaining the file step by step alongside excerpts of the real
code. Every excerpt is quoted verbatim and checked against the source.

## View

live at https://quadratic-svelte-documentation.vercel.app/

Machine-readable copies live at
[`/llms.txt`](https://quadratic-svelte-documentation.vercel.app/llms.txt) (an
index), [`/llms-full.txt`](https://quadratic-svelte-documentation.vercel.app/llms-full.txt)
(the whole corpus) and `/md/<page-path>` (one page's markdown).

## Run

```sh
pnpm i
pnpm dev
```

Requires the `quadratic-svelte` repository checked out as a sibling directory
(`../quadratic-svelte`) for `pnpm gen` and `pnpm check`.

## Check the docs against the source

```sh
pnpm check
```

`scripts/check-docs.mjs` is what keeps the documentation honest. It reports:

- **drift** — a quoted line that no longer appears in the file it came from,
  which is how pages silently rot as the source changes,
- **orphans** — a page whose `source:` file no longer exists, and source files
  that have no page yet,
- **MDX hazards** — raw `<`, `>`, `{` or `}` in prose, malformed step fences,
  and `// !mark` annotations outside a `<script>` region in a `svelte` fence,
  where Code Hike renders them as literal text instead of highlighting.

Without `../quadratic-svelte` present it runs the MDX checks only. CI
(`.github/workflows/ci.yml`) checks out both repositories so the full set runs.

## Regenerate pages

```sh
pnpm gen
```

`scripts/generate-docs.mjs` walks `../quadratic-svelte` (`src/`,
`quadratic-core/src/`, `scripts/`) and, for every source file:

- creates `content/docs/<path>.mdx` with the file's leading comment as the
  summary and its full source embedded,
- rewrites only pages whose frontmatter says `generated: true`,
- prunes generated pages whose source file is gone, and *reports* hand-written
  pages in the same state rather than deleting prose worth keeping,
- rewrites every `meta.json` (folders first, like a file explorer).

Every page is currently hand-written, so `gen` is now mainly a way to scaffold
pages for files newly added to the project.

## Write a walkthrough

To promote a generated page to a hand-written walkthrough, remove
`generated: true` from its frontmatter and write Code Hike
[scrollycoding](https://codehike.org/docs/layouts/scrollycoding) content —
see `content/docs/src/lib/core/a1.ts.mdx` for the pattern:

````mdx
<Scrollycoding>

## !!steps Step title

Explanation shown next to the code.

```ts ! file.ts
// the code for this step; annotate with // !mark or // !mark(1:3)
```

</Scrollycoding>
````

Keep the `source:` frontmatter field — it renders the
"View source on GitHub" button and is what `pnpm check` verifies excerpts
against.

Two rules worth knowing before writing: code inside a fence must be copied
**verbatim** from the source (use a `// ...` line to mark omissions), and
`// !mark` only works where `//` is a real comment — in a `.svelte` fence that
means inside `<script>` only, never in markup or `<style>`. `pnpm check`
enforces both.
