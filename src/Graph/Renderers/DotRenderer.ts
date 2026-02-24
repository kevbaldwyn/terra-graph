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

type DotLegendEntry = {
  title: string;
  colour: string;
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
    output = this.applyLegend(output, tg);
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

  private collectLegendEdges(tg: TgGraph): TgEdge[] {
    return tg.edges.filter((edge) => edge.attributes?.legend !== undefined);
  }

  private collectLegendEntries(tg: TgGraph): DotLegendEntry[] {
    const entries = this.collectLegendEdges(tg)
      .map((edge) => edge.attributes?.legend)
      .filter((legend): legend is DotLegendEntry => legend !== undefined);

    const unique = new Map<string, DotLegendEntry>();
    for (const entry of entries) {
      unique.set(`${entry.title}:${entry.colour}`, entry);
    }

    return [...unique.values()];
  }

  private toDotNodeAttributes(node: TgNode): Record<string, unknown> {
    return {
      label: this.buildNodeLabel(node),
      ...(node.adapter?.[DotAdapter.name] ?? {}),
    };
  }

  private toDotEdgeAttributes(edge: TgEdge): Record<string, unknown> {
    const dotAdapterAttributes =
      edge.attributes?.adapter?.[DotAdapter.name] ?? {};

    if (edge.attributes?.legend) {
      return {
        ...dotAdapterAttributes,
        color: edge.attributes.legend.colour,
      };
    }

    return {
      ...dotAdapterAttributes,
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

  private applyLegend(output: string, tg: TgGraph): string {
    const legends = this.collectLegendEntries(tg);
    const hasDescription = Object.keys(tg.description).length > 0;

    if (legends.length === 0 && !hasDescription) {
      return output;
    }

    const clusterName = 'Legend';
    const descriptionRows = Object.entries(tg.description)
      .map(([key, value]) => {
        return `<tr><td align="left"><font point-size="10" color="#999999">${key}:</font></td><td align="left"><font point-size="10" color="#000000">&nbsp;&nbsp;&nbsp;${String(
          value,
        )}</font></td></tr>`;
      })
      .join('');

    const descriptionNode = hasDescription
      ? `    "${clusterName}_description" [shape="plaintext" fontname="sans-serif" label=<<table align="left" border="0" cellpadding="2" cellspacing="0" cellborder="0">${descriptionRows}</table>>];`
      : '';

    const legendRows = legends
      .map((legend, index) => {
        const descriptionLink = hasDescription
          ? `\n    "${clusterName}_description" -> "${clusterName}.A${index}" [style="invis"];`
          : '';

        return [
          `    "${clusterName}.A${index}" [label="" style="invis" height=0 width=0];`,
          `    "${clusterName}.B${index}" [label="" style="invis" height=0 width=0];`,
          `    "${clusterName}.A${index}" -> "${clusterName}.B${index}" [label="${legend.title}" fontname="sans-serif" fontsize="10" color="${legend.colour}"];${descriptionLink}`,
        ].join('\n');
      })
      .join('\n');

    const keySubgraph = `  subgraph "cluster_${clusterName}" {
    label = "${clusterName}"
    color = "#DDDDDD"
    fontname = "sans-serif"
    penwidth = 0.75
    fontcolor = "#999999"
    fontsize = 10
${descriptionNode}
${legendRows}
  }
  subgraph cluster_padKey {
    style = "invis"
    "S1" [style="invis"];
    "S2" [style="invis"];
    "S3" [style="invis"];
    "S4" [style="invis"];
    "S1" -> "S2" [style="invis"];
    "S2" -> "S3" [style="invis"];
    "S3" -> "S4" [style="invis"];
  }`;

    const firstBrace = output.indexOf('{');
    if (firstBrace === -1) {
      return output;
    }

    return `${output.slice(0, firstBrace + 1)}\n${keySubgraph}\n${output.slice(
      firstBrace + 1,
    )}`;
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
