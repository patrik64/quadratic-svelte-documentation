import type * as PageTree from 'fumadocs-core/page-tree';
import {
  BookOpen,
  FileCode,
  FileJson,
  FileText,
  FileType,
  FlaskConical,
  Folder,
  Network,
} from 'lucide-react';
import type { ReactNode } from 'react';

const SIZE = 15;

// Language colors, so the tree scans like an editor's file explorer.
const BY_EXTENSION: Record<string, { icon: typeof FileCode; className: string }> = {
  ts: { icon: FileCode, className: 'text-[#3178c6]' },
  js: { icon: FileCode, className: 'text-[#c9a227]' },
  mjs: { icon: FileCode, className: 'text-[#c9a227]' },
  svelte: { icon: FileCode, className: 'text-[#ff3e00]' },
  rs: { icon: FileCode, className: 'text-[#bc826a]' },
  css: { icon: FileType, className: 'text-[#8b5cf6]' },
  html: { icon: FileCode, className: 'text-[#e34c26]' },
  json: { icon: FileJson, className: 'text-fd-muted-foreground' },
};

const OVERVIEW_ICONS: Record<string, { icon: typeof FileCode; className: string }> = {
  '/docs': { icon: BookOpen, className: 'text-fd-muted-foreground' },
  '/docs/architecture': { icon: Network, className: 'text-fd-muted-foreground' },
};

function iconFor(url: string): ReactNode {
  const overview = OVERVIEW_ICONS[url];
  if (overview) {
    const { icon: Icon, className } = overview;
    return <Icon size={SIZE} className={className} />;
  }

  const filename = url.slice(url.lastIndexOf('/') + 1);

  // tests get their own mark so they don't read as another source file
  if (/\.(test|spec)\.[jt]s$/.test(filename)) {
    return <FlaskConical size={SIZE} className="text-fd-muted-foreground" />;
  }

  const extension = filename.slice(filename.lastIndexOf('.') + 1);
  const match = BY_EXTENSION[extension];
  if (!match) return <FileText size={SIZE} className="text-fd-muted-foreground" />;

  const { icon: Icon, className } = match;
  return <Icon size={SIZE} className={className} />;
}

function decorate(node: PageTree.Node): PageTree.Node {
  if (node.type === 'folder') {
    return {
      ...node,
      icon: node.icon ?? <Folder size={SIZE} className="text-fd-muted-foreground" />,
      index: node.index ? (decorate(node.index) as PageTree.Item) : undefined,
      children: node.children.map(decorate),
    };
  }

  if (node.type === 'page') {
    return { ...node, icon: node.icon ?? iconFor(node.url) };
  }

  return node;
}

/**
 * Attaches a folder icon to every directory and a language-colored file icon to
 * every page, so the sidebar mirrors the source tree the way an editor shows it.
 * Returns a copy — fumadocs caches the tree between requests.
 */
export function withTreeIcons(tree: PageTree.Root): PageTree.Root {
  return { ...tree, children: tree.children.map(decorate) };
}
