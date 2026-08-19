import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GITHUB_REPO, LIVE_APP } from '@/lib/github';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.55" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.55" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.25" />
          </svg>
          quadratic-svelte docs
        </>
      ),
    },
    githubUrl: GITHUB_REPO,
    links: [
      {
        text: 'Live app',
        url: LIVE_APP,
      },
    ],
  };
}
