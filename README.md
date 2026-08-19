# quadratic-svelte documentation

Annotated source documentation for [quadratic-svelte](https://github.com/patrik64/quadratic-svelte),
built with Next.js, [fumadocs](https://fumadocs.dev) and [Code Hike](https://codehike.org).

The sidebar mirrors the project's file tree — one page per source file. Key
files are documented as **scrollycoding walkthroughs** (scroll-driven code
panel with animated token transitions); all other pages are auto-generated and
embed the full, syntax-highlighted source with a link to the file on GitHub.

## View

live at https://quadratic-svelte-documentation.vercel.app/

## Run

```sh
pnpm i
pnpm dev
```

Requires the `quadratic-svelte` repository checked out as a sibling directory
(`../quadratic-svelte`) for `pnpm gen`.

## Regenerate pages

```sh
pnpm gen
```

`scripts/generate-docs.mjs` walks `../quadratic-svelte` (`src/`,
`quadratic-core/src/`, `scripts/`) and, for every source file:

- creates `content/docs/<path>.mdx` with the file's leading comment as the
  summary and its full source embedded,
- rewrites only pages whose frontmatter says `generated: true`,
- prunes generated pages whose source file is gone,
- rewrites every `meta.json` (folders first, like a file explorer).

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
"View source on GitHub" button.
