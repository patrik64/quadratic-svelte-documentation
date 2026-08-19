import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { withTreeIcons } from '@/lib/tree-icons';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={withTreeIcons(source.getPageTree())} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
