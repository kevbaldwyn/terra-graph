import { DirectedGraph } from 'graphology';
import type { AbstractGraph as Graphology } from 'graphology-types';
import { AdapterOperations } from '../Operations/Operations.js';
import {
  EdgeId,
  NodeId,
  TgEdge,
  type TgEdgeAttributes,
  TgGraph,
  TgNode,
  TgNodeAttributes,
  asNodeId,
} from '../TgGraph.js';
import { JsonRenderer } from '../Renderers/JsonRenderer.js';

export enum GraphAttributeKey {
  Description = 'tg:description',
}

export class GraphologyAdapter implements AdapterOperations {
  constructor(private readonly graph: Graphology) {}

  public withTgGraph(tg: TgGraph): this {
    return this.mutateGraph((graph) => {
      for (const node of Object.values(tg.nodes)) {
        graph.addNode(node.id, node);
      }

      for (const edge of tg.edges) {
        graph.addEdgeWithKey(
          edge.id,
          edge.from,
          edge.to,
          edge.attributes ?? {},
        );
      }
      graph.setAttribute(GraphAttributeKey.Description, tg.description);
    });
  }

  public toTgGraph(): TgGraph {
    const nodes: Record<string, TgNode> = {};
    const edges: TgEdge[] = [];

    this.graph.forEachNode((nodeId, attributes) => {
      const id = asNodeId(nodeId);
      nodes[nodeId] = {
        id,
        ...attributes,
        label: attributes.label ?? id,
      };
    });

    this.graph.forEachEdge(
      (edgeId, attributes: TgEdgeAttributes, source, target) => {
        edges.push({
          id: edgeId as EdgeId,
          from: source as NodeId,
          to: target as NodeId,
          attributes,
        });
      },
    );

    const description = this.readGraphAttribute<Record<string, string>>(
      GraphAttributeKey.Description,
      {},
    );

    return {
      nodes,
      edges,
      description,
    };
  }

  public getRenderer() {
    return new JsonRenderer();
  }

  public getGraph(): Graphology {
    return this.graph.copy();
  }

  public getNodeAttributes(nodeId: NodeId): TgNodeAttributes | undefined {
    if (!this.graph.hasNode(nodeId)) {
      return undefined;
    }
    return this.graph.getNodeAttributes(nodeId) as TgNodeAttributes;
  }

  public getEdgeAttributes(edgeId: EdgeId): TgEdgeAttributes {
    return this.graph.getEdgeAttributes(edgeId) as TgEdgeAttributes;
  }

  public edgeSource(edgeId: EdgeId): NodeId {
    return this.graph.source(edgeId) as NodeId;
  }

  public edgeTarget(edgeId: EdgeId): NodeId {
    return this.graph.target(edgeId) as NodeId;
  }

  public nodeIds(): NodeId[] {
    return this.graph.nodes() as NodeId[];
  }

  public neighbors(nodeId: NodeId): NodeId[] {
    return this.graph.neighbors(nodeId) as NodeId[];
  }

  public predecessors(nodeId: NodeId): NodeId[] {
    return this.graph.inNeighbors(nodeId) as NodeId[];
  }

  public successors(nodeId: NodeId): NodeId[] {
    return this.graph.outNeighbors(nodeId) as NodeId[];
  }

  public inEdges(nodeId: NodeId): EdgeId[] {
    return this.graph.inEdges(nodeId) as EdgeId[];
  }

  public outEdges(nodeId: NodeId): EdgeId[] {
    return this.graph.outEdges(nodeId) as EdgeId[];
  }

  public edgesBetween(source: NodeId, target: NodeId): EdgeId[] {
    return this.graph.edges(source, target) as EdgeId[];
  }

  public setNodeAttributes(nodeId: NodeId, attributes: TgNodeAttributes): this {
    return this.mutateGraph((graph) => {
      graph.mergeNode(nodeId, attributes);
    });
  }

  public setEdge(
    edgeId: EdgeId,
    source: NodeId,
    target: NodeId,
    attributes: TgEdgeAttributes,
  ): this {
    return this.mutateGraph((graph) => {
      graph.mergeEdgeWithKey(edgeId, source, target, attributes);
    });
  }

  public removeNode(nodeId: NodeId): this {
    return this.mutateGraph((graph) => {
      graph.dropNode(nodeId);
    });
  }

  public removeEdge(edgeId: EdgeId): this {
    return this.mutateGraph((graph) => {
      graph.dropEdge(edgeId);
    });
  }

  public getLegend(): EdgeId[] {
    const legend: EdgeId[] = [];
    const seen = new Set<string>();
    this.graph.forEachEdge((edgeId) => {
      const attributes = this.graph.getEdgeAttributes(
        edgeId,
      ) as TgEdgeAttributes;
      if (attributes.legend) {
        const key = attributes.legend.label;
        if (!seen.has(key)) {
          seen.add(key);
          legend.push(edgeId as EdgeId);
        }
      }
    });
    return legend;
  }

  protected readGraphAttribute<T>(key: string, fallback: T): T {
    const value = this.graph.getAttribute(key);
    if (value !== undefined && value !== null) {
      return value as T;
    }
    const attrs = this.graph.getAttributes();
    return (attrs[key] as T) ?? fallback;
  }

  protected mutateGraph(mutate: (graph: Graphology) => void): this {
    const nextGraph = this.getGraph();
    mutate(nextGraph);
    const Ctor = this.constructor as new (graph: Graphology) => this;
    return new Ctor(nextGraph);
  }
}
