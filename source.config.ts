import { defineConfig, defineDocs, frontmatterSchema } from 'fumadocs-mdx/config';
import { remarkCodeHike, recmaCodeHike, type CodeHikeConfig } from 'codehike/mdx';
import { z } from 'zod';

const codeHikeConfig: CodeHikeConfig = {
  components: {
    // every MDX code fence renders through our <Code /> component (components/code.tsx)
    code: 'Code',
  },
  syntaxHighlighting: {
    // highlighted at compile time; colors come from the --ch-* variables in app/global.css
    theme: 'github-from-css',
  },
};

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      // repo-relative path in patrik64/quadratic-svelte; rendered as a
      // "View source on GitHub" button by app/docs/[[...slug]]/page.tsx
      source: z.string().optional(),
      // marks pages that scripts/generate-docs.mjs may overwrite on re-run
      generated: z.boolean().optional(),
    }),
  },
});

export default defineConfig({
  // global, not per-collection: collection-level mdxOptions would replace
  // fumadocs' default plugin preset instead of merging with it
  mdxOptions: {
    // Code Hike must run before fumadocs' remark plugins so `## !!steps`
    // headings inside <Scrollycoding> don't leak into the table of contents
    remarkPlugins: (v) => [[remarkCodeHike, codeHikeConfig], ...v],
    recmaPlugins: [[recmaCodeHike, codeHikeConfig]],
  },
});
