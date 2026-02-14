import { Graph as GraphLibGraph } from 'graphlib';
import * as dot from 'graphlib-dot';
import { DotAdapter } from '../Adapters/DotAdapter.js';
import { TgEdge, TgGraph, TgNode } from '../TgGraph.js';
import { Renderer } from '../Renderer.js';

export class DotRenderer implements Renderer<DotAdapter> {
  // constructor(private readonly adapter: DotAdapter) {}

  public render(adapter: DotAdapter): string {
    const tg = adapter.toTgGraph();
    const graph = new GraphLibGraph({
      directed: true,
      multigraph: true,
      compound: true,
    });

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
      label: node.label,
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
}
