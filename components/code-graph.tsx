import Link from 'fumadocs-core/link';
import { GraphView } from '@/components/graph-view';
import { buildGraph, KINDS, type Kind, listConnections } from '@/lib/build-graph';

// The server half of the Code Graph page: the graph is assembled from the
// compiled pages here, and reaches the client-side canvas as plain JSON.
export function CodeGraph() {
  const graph = buildGraph();

  return (
    <>
      <figure className="not-prose my-6">
        <GraphView graph={graph} />
        <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-fd-muted-foreground">
          {(Object.keys(KINDS) as Kind[]).map((kind) => (
            <span key={kind} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ background: `var(--graph-${kind})` }}
              />
              {KINDS[kind]}
              <span className="tabular-nums">
                ({graph.nodes.filter((node) => node.kind === kind).length})
              </span>
            </span>
          ))}
          <span>
            {graph.nodes.length} files, {graph.links.length} connections
          </span>
        </figcaption>
      </figure>

      {/* the same data without the canvas: for screen readers, for the
          keyboard, and for finding a file by name */}
      <details>
        <summary className="cursor-pointer text-sm font-medium">Show the graph as a table</summary>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Connections</th>
              <th>Connected to</th>
            </tr>
          </thead>
          <tbody>
            {listConnections(graph).map(({ node, linked }) => (
              <tr key={node.url}>
                <td>
                  <Link href={node.url} prefetch={false} title={node.path}>
                    {node.text}
                  </Link>
                </td>
                <td className="tabular-nums">{linked.length}</td>
                <td>
                  {linked.map((other, i) => (
                    <span key={other.url}>
                      {i > 0 && ', '}
                      <Link href={other.url} prefetch={false} title={other.path}>
                        {other.text}
                      </Link>
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
