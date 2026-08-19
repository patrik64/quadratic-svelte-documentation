import fs from 'node:fs';
import path from 'node:path';

const CONTENT = path.join(process.cwd(), 'content', 'docs');

export interface DocEntry {
  /** Site path, e.g. /docs/src/lib/core/a1.ts */
  url: string;
  title: string;
  description: string;
  /** Repo-relative path in quadratic-svelte, when the page documents one file. */
  source?: string;
  /** MDX body with the frontmatter removed. */
  body: string;
}

function readFrontmatterField(fm: string, key: string): string | undefined {
  const m = new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(fm);
  if (!m) return undefined;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/**
 * Reads the MDX corpus straight from disk. Done here rather than through the
 * fumadocs loader because these routes want the authored markdown, not the
 * compiled output — and the files are the source of truth either way.
 */
export function getDocs(): DocEntry[] {
  const files: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.mdx')) files.push(full);
    }
  })(CONTENT);

  return files
    .map((file) => {
      const text = fs.readFileSync(file, 'utf8');
      const fm = /^---\n([\s\S]*?)\n---\n/.exec(text);
      const rel = path.relative(CONTENT, file).replace(/\.mdx$/, '');
      const url = rel === 'index' ? '/docs' : `/docs/${rel}`;
      return {
        url,
        title: readFrontmatterField(fm?.[1] ?? '', 'title') ?? rel,
        description: readFrontmatterField(fm?.[1] ?? '', 'description') ?? '',
        source: readFrontmatterField(fm?.[1] ?? '', 'source'),
        body: fm ? text.slice(fm[0].length).trim() : text.trim(),
      };
    })
    .sort((a, b) => a.url.localeCompare(b.url));
}
