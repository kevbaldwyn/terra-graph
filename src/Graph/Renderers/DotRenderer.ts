import { Graph as GraphLibGraph } from 'graphlib';
import dot from 'graphlib-dot';
import { DotAdapter } from '../Adapters/DotAdapter.js';
import { Renderer } from '../Renderer.js';
import { TgEdge, TgGraph, TgNode } from '../TgGraph.js';

type DotGraphAttributes = {
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL';
  ranksep?: number;
  nodesep?: number;
  pad?: number;
} & Record<string, string | number | boolean | undefined>;

export type DotRendererOptions = {
  graph?: DotGraphAttributes;
};

const defaultGraphOptions: DotRendererOptions = {
  graph: {
    rankdir: 'LR',
    ranksep: 2.5,
    nodesep: 0.6,
    pad: 1,
  },
};

export class DotRenderer implements Renderer<DotAdapter> {
  private readonly options: DotRendererOptions;

  constructor(options: DotRendererOptions = {}) {
    this.options = {
      graph: DotRenderer.resolveGraphOptions(options.graph),
    };
  }

  public render(adapter: DotAdapter): string {
    const tg = adapter.toTgGraph();
    const graph = new GraphLibGraph({
      directed: true,
      multigraph: true,
      compound: true,
    });

    graph.setGraph(this.options.graph ?? {});

    this.addNodes(graph, tg);
    this.addEdges(graph, tg);

    let output = dot.write(graph);
    output = this.applyRanks(output, adapter);
    return output;
  }

  private addNodes(graph: GraphLibGraph, tg: TgGraph) {
    for (const node of Object.values(tg.nodes)) {
      graph.setNode(node.id, this.toDotNodeAttributes(node));
    }
  }

  private addEdges(graph: GraphLibGraph, tg: TgGraph) {
    for (const edge of tg.edges) {
      graph.setEdge(
        { v: edge.from, w: edge.to, name: edge.id as unknown as string },
        this.toDotEdgeAttributes(edge),
      );
    }
  }

  private toDotNodeAttributes(node: TgNode): Record<string, unknown> {
    return {
      label: this.buildNodeLabel(node),
      ...(node.adapter?.[DotAdapter.name] ?? {}),
    };
  }

  private toDotEdgeAttributes(edge: TgEdge): Record<string, unknown> {
    return {
      ...(edge.attributes?.adapter?.[DotAdapter.name] ?? {}),
    };
  }

  private applyRanks(output: string, adapter: DotAdapter): string {
    const ranks = adapter.getRanks();
    if (ranks.length === 0) {
      return output;
    }

    const rankBlock = ranks
      .map((rank) => {
        const nodes = rank.nodes.map((nodeId) => `"${nodeId}"`).join(' ');
        return `  { rank = ${rank.mode}; ${nodes} }`;
      })
      .join('\n');

    const lastBrace = output.lastIndexOf('}');
    if (lastBrace === -1) {
      return output;
    }

    return `${output.slice(0, lastBrace)}\n${rankBlock}\n}`;
  }

  private buildNodeLabel(node: TgNode): string {
    const resource = node.terraform?.resource ?? '';
    const name = node.terraform?.name ?? '';
    if (resource && name) {
      return `${resource}.${name}`;
    }
    if (name) {
      return name;
    }
    if (resource) {
      return resource;
    }
    return String(node.id);
  }

  private static resolveGraphOptions(
    input?: DotGraphAttributes,
  ): DotGraphAttributes {
    const graphOptions: DotGraphAttributes = {
      ...(defaultGraphOptions.graph ?? {}),
      ...(input ?? {}),
    };

    if (graphOptions.rankdir === 'TB' || graphOptions.rankdir === 'BT') {
      return {
        ...graphOptions,
        nodesep: input?.nodesep ?? 2.5,
        ranksep: input?.ranksep ?? 0.6,
      };
    }

    return graphOptions;
  }
}
