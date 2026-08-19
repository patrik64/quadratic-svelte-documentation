export const GITHUB_REPO = 'https://github.com/patrik64/quadratic-svelte';
export const LIVE_APP = 'https://quadratic-svelte.vercel.app';

/** Blob URL for a repo-relative path like `src/lib/core/a1.ts`. */
export function githubBlobUrl(sourcePath: string): string {
  return `${GITHUB_REPO}/blob/main/${sourcePath}`;
}
