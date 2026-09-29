'use client';
import { lazy, type RefObject, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
} from 'd3-force';
import { useRouter } from 'fumadocs-core/framework';
import { Maximize } from 'lucide-react';

// Started from the fumadocs Graph View (`npx @fumadocs/cli add graph-view`) and
// adapted for a graph of ~100 nodes with ~10 links each. The stock component
// sizes its canvas to the window, labels every node and pulls nodes together,
// which at this density gives an off-center disc of overlapping text.

export interface Graph {
  links: Link[];
  nodes: Node[];
}

export type Node = NodeObject<NodeType>;
export type Link = LinkObject<NodeType, LinkType>;

export interface NodeType {
  text: string;
  description?: string;
  neighbors?: string[];
  url: string;
  /** Shown in full on hover, where `text` may be only the file name. */
  path?: string;
  /** Picks the node's color: the value of the `--graph-<kind>` CSS variable. */
  kind?: string;
}

export type LinkType = Record<string, unknown>;

export interface GraphViewProps {
  graph: Graph;
}

interface Size {
  width: number;
  height: number;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Colors and font of the current theme, read from CSS once per frame. */
interface Theme {
  surface: string;
  text: string;
  muted: string;
  primary: string;
  font: string;
  kind: (kind: string | undefined) => string;
}

// Used for the initial layout and again by the live simulation that a drag
// wakes. With different values there, the first drag would reshape the graph.
const LINK_DISTANCE = 60;
const CHARGE = -420;
const COLLIDE = 24;
const GRAVITY = 0.07;

/** How much wider than tall the layout is made; limited, so neither axis is squeezed flat. */
const stretchOf = ({ width, height }: Size) => Math.max(0.6, Math.min(1.8, width / height));

/**
 * The pull toward the middle, per axis. Pulling harder along the container's
 * short side stretches the layout along its long one, so a wide canvas gets a
 * wide graph rather than a round one with empty space either side.
 */
function gravity(size: Size) {
  const stretch = stretchOf(size);
  return {
    x: forceX().strength(GRAVITY / stretch),
    y: forceY().strength(GRAVITY * stretch),
  };
}

// Everything below is in screen pixels. Dividing by the zoom level when
// drawing keeps marks and text the same size however far in the reader is.
const FONT_SIZE = 12;
const HIT_RADIUS = 12;
/**
 * With the whole graph in view, one label per this much canvas: about a dozen
 * on a desktop, three on a phone.
 */
const AREA_PER_LABEL = 40_000;

const linkCount = (node: Node) => node.neighbors?.length ?? 0;
const nodeRadius = (node: Node) => 4 + Math.sqrt(linkCount(node)) * 0.7;
const fitPadding = (size: Size) => Math.min(56, size.width * 0.1);

/** The zoom level at which the whole graph fills the canvas, as `zoomToFit` picks it. */
function fitScale(bbox: { x: [number, number]; y: [number, number] } | null, size: Size) {
  if (!bbox) return 1;
  const padding = fitPadding(size) * 2;
  return Math.min(
    (size.width - padding) / (bbox.x[1] - bbox.x[0]),
    (size.height - padding) / (bbox.y[1] - bbox.y[0]),
  );
}

const ForceGraph2D = lazy(
  () => import('react-force-graph-2d'),
) as typeof import('react-force-graph-2d').default;

export function GraphView({ graph }: GraphViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  // the canvas needs a size in pixels, and `window` must not be touched while
  // prerendering, so nothing is drawn until the container has been measured
  const [size, setSize] = useState<Size | null>(null);
  const [hovered, setHovered] = useState<Node | null>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border">
      <div ref={ref} className="relative h-[min(640px,70vh)] bg-fd-background">
        {size && (
          <Suspense fallback={null}>
            <GraphCanvas
              graph={graph}
              size={size}
              containerRef={ref}
              hovered={hovered}
              onHover={setHovered}
            />
          </Suspense>
        )}
      </div>
      {/* below the canvas rather than beside the pointer, where it would cover
          the very neighbors that hovering is meant to show */}
      <div aria-hidden className="min-h-20 border-t bg-fd-card px-3 py-2 text-sm">
        {hovered ? (
          <>
            <p>
              <span className="font-medium">{hovered.path ?? hovered.text}</span>
              <span className="text-fd-muted-foreground">
                {' · '}
                {linkCount(hovered)} {linkCount(hovered) === 1 ? 'connection' : 'connections'}
              </span>
            </p>
            <p className="line-clamp-2 text-fd-muted-foreground">{hovered.description}</p>
          </>
        ) : (
          <p className="text-fd-muted-foreground">
            Hover a file to see what it connects to, click it to open its page. Scroll to zoom,
            drag to move.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Runs the force simulation to rest before anything is drawn, so the graph
 * appears already laid out instead of flying into place.
 */
function settle(graph: Graph, size: Size): Graph {
  const { nodes, links } = structuredClone(graph);
  const pull = gravity(size);

  // neighbors drive the hover highlight, node sizes and label order; collected
  // first because forceLink swaps each link's ids for the node objects
  for (const node of nodes) {
    node.neighbors = links.flatMap((link) => {
      if (link.source === node.id) return link.target as string;
      if (link.target === node.id) return link.source as string;
      return [];
    });
  }

  forceSimulation(nodes)
    .force(
      'link',
      // every link built by lib/build-graph.ts names both of its ends
      forceLink<Node, SimulationLinkDatum<Node>>(links as SimulationLinkDatum<Node>[])
        .id((node) => node.id as string)
        .distance(LINK_DISTANCE),
    )
    .force('charge', forceManyBody().strength(CHARGE))
    .force('collide', forceCollide(COLLIDE))
    .force('x', pull.x)
    .force('y', pull.y)
    .stop()
    .tick(300);

  return { nodes, links };
}

function readTheme(container: HTMLElement): Theme {
  const style = getComputedStyle(container);
  const muted = style.getPropertyValue('--color-fd-muted-foreground');
  const kinds = new Map<string | undefined, string>();

  return {
    surface: style.backgroundColor,
    text: style.color,
    muted,
    primary: style.getPropertyValue('--color-fd-primary'),
    font: style.fontFamily,
    kind(kind) {
      let color = kinds.get(kind);
      if (color === undefined) {
        color = (kind && style.getPropertyValue(`--graph-${kind}`).trim()) || muted;
        kinds.set(kind, color);
      }
      return color;
    },
  };
}

const overlaps = (a: Box, b: Box, gap: number) =>
  a.left < b.right + gap &&
  a.right + gap > b.left &&
  a.top < b.bottom + gap &&
  a.bottom + gap > b.top;

// the hit area is larger than the dot, which is too small a target on its own
function paintHitArea(node: Node, color: string, ctx: CanvasRenderingContext2D, scale: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x!, node.y!, Math.max(HIT_RADIUS, nodeRadius(node) + 4) / scale, 0, 2 * Math.PI);
  ctx.fill();
}

function GraphCanvas({
  containerRef,
  graph,
  size,
  hovered,
  onHover,
}: GraphViewProps & {
  containerRef: RefObject<HTMLDivElement | null>;
  size: Size;
  hovered: Node | null;
  onHover: (node: Node | null) => void;
}) {
  const graphRef = useRef<ForceGraphMethods<Node, Link> | undefined>(undefined);
  const themeRef = useRef<Theme | null>(null);
  const fitted = useRef(false);
  const router = useRouter();
  // the simulation stays off until the first fit, then wakes whenever a node is dragged
  const [live, setLive] = useState(false);
  const [, repaint] = useState(0);
  // the size the current layout was shaped for
  const [shape, setShape] = useState(size);

  const data = useMemo(() => settle(graph, shape), [graph, shape]);
  const byLinkCount = useMemo(
    () => [...data.nodes].sort((a, b) => linkCount(b) - linkCount(a)),
    [data],
  );

  // stable across renders: React re-attaches a ref whose identity changes, and
  // re-running the setter would swap in fresh forces on every hover
  const handle = useMemo(
    () => ({
      get current() {
        return graphRef.current;
      },
      set current(fg) {
        graphRef.current = fg;
        if (!fg) return;

        // the link force is adjusted in place, never replaced: the library has
        // already handed this instance the links, and a new one would have none
        const link = fg.d3Force('link') as ReturnType<typeof forceLink> | undefined;
        link?.distance(LINK_DISTANCE);
        const pull = gravity(shape);
        fg.d3Force('charge', forceManyBody().strength(CHARGE));
        fg.d3Force('collide', forceCollide(COLLIDE));
        fg.d3Force('x', pull.x);
        fg.d3Force('y', pull.y);
        fg.d3Force('center', null);
      },
    }),
    [shape],
  );

  useEffect(() => {
    // a canvas that changes proportions, as when a phone is turned, is laid
    // out again from scratch, the same way as on first load
    if (Math.abs(stretchOf(size) - stretchOf(shape)) > 0.3) {
      fitted.current = false;
      setLive(false);
      onHover(null);
      setShape(size);
      return;
    }
    // any other resize only needs the graph brought back into view
    if (fitted.current) graphRef.current?.zoomToFit(0, fitPadding(size));
  }, [size, shape, onHover]);

  // the canvas is only redrawn on demand, so a theme switch has to ask for it
  useEffect(() => {
    const observer = new MutationObserver(() => repaint((n) => n + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isActive = (node: Node) =>
    hovered !== null && (hovered.id === node.id || hovered.neighbors!.includes(node.id as string));

  const drawNode = (node: Node, ctx: CanvasRenderingContext2D, scale: number) => {
    const theme = themeRef.current;
    if (!theme) return;
    const radius = nodeRadius(node) / scale;

    ctx.globalAlpha = hovered === null || isActive(node) ? 1 : 0.15;

    // a ring in the surface color keeps a dot legible where links cross it
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, radius + 2 / scale, 0, 2 * Math.PI);
    ctx.fillStyle = hovered?.id === node.id ? theme.primary : theme.surface;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
    ctx.fillStyle = theme.kind(node.kind);
    ctx.fill();

    ctx.globalAlpha = 1;
  };

  const drawLink = (link: Link, ctx: CanvasRenderingContext2D, scale: number) => {
    const theme = themeRef.current;
    const { source, target } = link;
    if (!theme || typeof source !== 'object' || typeof target !== 'object') return;
    const active = hovered !== null && (hovered.id === source.id || hovered.id === target.id);

    ctx.globalAlpha = hovered === null ? 0.3 : active ? 0.9 : 0.05;
    ctx.strokeStyle = active ? theme.primary : theme.muted;
    ctx.lineWidth = (active ? 1.5 : 1) / scale;
    ctx.beginPath();
    ctx.moveTo(source.x!, source.y!);
    ctx.lineTo(target.x!, target.y!);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // Labels are drawn after every node, so that no dot can cover one, and only
  // for some nodes: the hovered file and its neighbors, or else the most
  // connected files in view. Zooming in spreads the dots apart and leaves fewer
  // of them in view, so more and more get named.
  const drawLabels = (ctx: CanvasRenderingContext2D, scale: number) => {
    const theme = themeRef.current;
    const fg = graphRef.current;
    if (!theme || !fg) return;

    const min = fg.screen2GraphCoords(0, 0);
    const max = fg.screen2GraphCoords(size.width, size.height);
    const inView = (node: Node) =>
      node.x! >= min.x && node.x! <= max.x && node.y! >= min.y && node.y! <= max.y;

    const candidates = hovered
      ? [hovered, ...byLinkCount.filter((node) => node.id !== hovered.id && isActive(node))]
      : byLinkCount.filter(inView);
    const zoomedIn = Math.max(1, scale / fitScale(fg.getGraphBbox(), size));
    const budget = hovered
      ? candidates.length
      : Math.max(3, Math.floor(((size.width * size.height) / AREA_PER_LABEL) * zoomedIn));

    const height = FONT_SIZE / scale;
    const gap = 4 / scale;
    const labels: Box[] = [];
    const dots = candidates.map((node): Box => {
      const radius = nodeRadius(node) / scale;
      return {
        left: node.x! - radius,
        right: node.x! + radius,
        top: node.y! - radius,
        bottom: node.y! + radius,
      };
    });

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3 / scale;
    ctx.strokeStyle = theme.surface;
    ctx.fillStyle = theme.text;

    for (const node of candidates) {
      if (labels.length >= budget) break;

      ctx.font = `${hovered?.id === node.id ? 600 : 400} ${height}px ${theme.font}`;
      const width = ctx.measureText(node.text).width;
      const reach = nodeRadius(node) / scale + gap;
      const at = (left: number, top: number): Box => ({
        left,
        right: left + width,
        top,
        bottom: top + height,
      });

      // nudged sideways where centered text would run off the edge of the canvas
      const centered = Math.max(
        min.x + gap,
        Math.min(max.x - gap - width, node.x! - width / 2),
      );
      const below = at(centered, node.y! + reach);
      const above = at(centered, node.y! - reach - height);
      const beside = [
        at(node.x! + reach, node.y! - height / 2),
        at(node.x! - reach - width, node.y! - height / 2),
      ];
      // the pointer sits on the hovered dot and covers what is below it
      const spots = (
        hovered?.id === node.id ? [above, ...beside, below] : [below, above, ...beside]
      ).filter(
        (spot) =>
          spot.left >= min.x && spot.right <= max.x && spot.top >= min.y && spot.bottom <= max.y,
      );

      const free = (spot: Box) => !labels.some((label) => overlaps(spot, label, gap));
      const clear = (spot: Box) => !dots.some((dot) => overlaps(spot, dot, 0));
      // clear of the other dots if possible, but a covered dot beats a missing name
      const spot = spots.find((spot) => free(spot) && clear(spot)) ?? spots.find(free);
      if (!spot) continue;
      labels.push(spot);

      // an outline in the surface color lifts the text off the links behind it
      ctx.strokeText(node.text, spot.left, spot.top);
      ctx.fillText(node.text, spot.left, spot.top);
    }
  };

  return (
    <>
      <div
        role="img"
        aria-label={`Graph of ${graph.nodes.length} files and the ${graph.links.length} connections between them. The table below lists the same data.`}
      >
        <ForceGraph2D<NodeType, LinkType>
          ref={handle}
          width={size.width}
          height={size.height}
          graphData={data}
          minZoom={0.05}
          maxZoom={6}
          cooldownTicks={live ? Infinity : 0}
          cooldownTime={3000}
          onEngineStop={() => {
            if (fitted.current) return;
            fitted.current = true;
            graphRef.current?.zoomToFit(0, fitPadding(size));
            // readers who asked for reduced motion keep the layout still
            setLive(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
          }}
          onRenderFramePre={() => {
            const container = containerRef.current;
            if (container) themeRef.current = readTheme(container);
          }}
          onRenderFramePost={drawLabels}
          nodeCanvasObject={drawNode}
          nodePointerAreaPaint={paintHitArea}
          linkCanvasObject={drawLink}
          onNodeHover={onHover}
          onNodeClick={(node) => {
            router.push(node.url);
          }}
          enableNodeDrag
          enableZoomInteraction
        />
      </div>
      <button
        type="button"
        aria-label="Fit the graph to the view"
        title="Fit to view"
        onClick={() => graphRef.current?.zoomToFit(400, fitPadding(size))}
        className="absolute right-2 top-2 rounded-md border bg-fd-background p-1.5 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        <Maximize size={14} />
      </button>
    </>
  );
}
