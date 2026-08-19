import { getDocs } from '@/lib/llms';
import { GITHUB_REPO } from '@/lib/github';

export const dynamic = 'force-static';

/** The whole corpus in one document, for pasting into a model's context. */
export function GET(): Response {
  const docs = getDocs();
  const parts = [
    '# quadratic-svelte — complete annotated source documentation',
    '',
    `Source: ${GITHUB_REPO}`,
    `${docs.length} pages. Each documents one file of the project.`,
    '',
  ];

  for (const doc of docs) {
    parts.push('---', '');
    parts.push(`# ${doc.title}`);
    if (doc.description) parts.push('', doc.description);
    if (doc.source) parts.push('', `Source file: \`${doc.source}\``);
    parts.push('', doc.body, '');
  }

  return new Response(parts.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
