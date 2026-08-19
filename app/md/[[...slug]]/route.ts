import { getDocs } from '@/lib/llms';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return getDocs().map((doc) => ({
    // '/docs' -> [], '/docs/a/b' -> ['a', 'b']
    slug: doc.url.replace(/^\/docs\/?/, '').split('/').filter(Boolean),
  }));
}

/** Serves a page's authored markdown, e.g. /md/src/lib/core/a1.ts */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
): Promise<Response> {
  const { slug } = await params;
  // Next returns segments percent-encoded, so a file named `+page.svelte`
  // arrives as `%2Bpage.svelte` and would never match.
  const decoded = (slug ?? []).map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });
  const url = decoded.length > 0 ? `/docs/${decoded.join('/')}` : '/docs';

  const doc = getDocs().find((d) => d.url === url);
  if (!doc) return new Response('Not found\n', { status: 404 });

  const header = [`# ${doc.title}`];
  if (doc.description) header.push('', doc.description);
  if (doc.source) header.push('', `Source file: \`${doc.source}\``);

  return new Response(`${header.join('\n')}\n\n${doc.body}\n`, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
