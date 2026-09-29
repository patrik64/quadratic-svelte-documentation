import { source } from '@/lib/source';
import type { Graph, Node } from '@/components/graph-view';

/**
 * Language families a node is colored by; each is a `--graph-<kind>` variable
 * in app/global.css. Three is the ceiling: in a graph any two nodes can end up
 * side by side, and a fourth color cannot stay distinct from all the others.
 */
export const KINDS = {
  script: 'TypeScript, JavaScript',
  ui: 'Svelte, HTML, CSS',
  rust: 'Rust',
} as const;

export type Kind = keyof typeof KINDS;

const KIND_BY_EXTENSION: Record<string, Kind> = {
  svelte: 'ui',
  html: 'ui',
  css: 'ui',
  rs: 'rust',
};

/**
 * The graph behind the Code Graph page: one node per documented source file,
 * and an edge wherever one file's page links to another's. The links come from
 * `extractedReferences`, which fumadocs-mdx exports per page (see
 * `postprocess` in source.config.ts).
 */
export function buildGraph(): Graph {
  // only pages that document a file: the overview pages link to nearly
  // everything, and would pull the whole picture into a few hubs
  const pages = source.getPages().filter((page) => page.data.source !== undefined);
  const urls = new Set(pages.map((page) => page.url));

  const titleCount = new Map<string, number>();
  for (const { data } of pages) {
    titleCount.set(data.title, (titleCount.get(data.title) ?? 0) + 1);
  }

  const graph: Graph = { links: [], nodes: [] };
  const seen = new Set<string>();

  for (const page of pages) {
    const { title, description, source: file = title } = page.data;

    graph.nodes.push({
      id: page.url,
      url: page.url,
      // `mod.rs` and `util.rs` exist in several folders; name the folder too
      text: titleCount.get(title) === 1 ? title : file.split('/').slice(-2).join('/'),
      path: file,
      description,
      kind: KIND_BY_EXTENSION[file.slice(file.lastIndexOf('.') + 1)] ?? 'script',
    });

    const { extractedReferences = [] } = page.data;
    for (const ref of extractedReferences) {
      const target = source.getPageByHref(ref.href)?.page.url;
      if (!target || target === page.url || !urls.has(target)) continue;

      // edges are drawn without direction, so A → B and B → A are one edge
      const key = [page.url, target].sort().join('\n');
      if (seen.has(key)) continue;
      seen.add(key);

      graph.links.push({ source: page.url, target });
    }
  }

  return graph;
}

/** Every file with the files it is connected to, the most connected first. */
export function listConnections(graph: Graph): { node: Node; linked: Node[] }[] {
  const byName = (a: Node, b: Node) => a.text.localeCompare(b.text);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const linked = new Map(graph.nodes.map((node) => [node.id, [] as Node[]]));

  for (const { source, target } of graph.links) {
    linked.get(source as string)!.push(byId.get(target as string)!);
    linked.get(target as string)!.push(byId.get(source as string)!);
  }

  return graph.nodes
    .map((node) => ({ node, linked: linked.get(node.id)!.sort(byName) }))
    .sort((a, b) => b.linked.length - a.linked.length || byName(a.node, b.node));
}
