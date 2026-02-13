import { Graph as GraphLibGraph } from 'graphlib';
import dot from 'graphlib-dot';
import { DotAdapter } from '../Adapters/DotAdapter.js';
import { ImportContext, Importer } from '../Importer.js';
import {
  TgEdgeAttributes,
  TgGraph,
  TgNode,
  asNodeId,
  edgeIdFrom,
} from '../TgGraph.js';

type GraphLibEdge = { v: string; w: string; name?: string };

export class TerraformDotImporter implements Importer {
  public fromString(input: string, context: ImportContext = {}): TgGraph {
    const graph = dot.read(input) as GraphLibGraph;
    const nodes: Record<string, TgNode> = {};
    const edges: TgGraph['edges'] = [];

    for (const nodeId of graph.nodes()) {
      const attributes = (graph.node(nodeId) ?? {}) as Record<string, unknown>;
      const { label, ...adapterAttributes } = attributes;
      const id = asNodeId(nodeId);
      const node: TgNode = {
        id,
        label: typeof label === 'string' ? label : nodeId,
      };

      if (Object.keys(adapterAttributes).length > 0) {
        node.adapter = {
          [DotAdapter.name]: adapterAttributes,
        };
      }

      nodes[nodeId] = node;
    }

    for (const edge of graph.edges() as GraphLibEdge[]) {
      const from = asNodeId(edge.v);
      const to = asNodeId(edge.w);
      const suffix = edge.name === undefined ? undefined : String(edge.name);
      const edgeId = edgeIdFrom(from, to, suffix);
      const attributes = (graph.edge(edge) ?? {}) as Record<string, unknown>;

      let edgeAttributes: TgEdgeAttributes | undefined;
      if (Object.keys(attributes).length > 0) {
        edgeAttributes = {
          adapter: {
            [DotAdapter.name]: attributes,
          },
        };
      }

      edges.push({
        id: edgeId,
        from,
        to,
        attributes: edgeAttributes,
      });
    }

    return {
      description: context.description ?? {},
      nodes,
      edges,
    };
  }
}
