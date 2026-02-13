import type { Adapter } from '../Adapter.js';
import type {
  EdgeId,
  NodeId,
  TgEdgeAttributes,
  TgNodeAttributes,
} from '../TgGraph.js';

// Minimal traversal/mutation surface for rules/plugins to depend on.
export interface Operations {
  getNodeAttributes(nodeId: NodeId): TgNodeAttributes | undefined;
  getEdgeAttributes(edgeId: EdgeId): TgEdgeAttributes;
  edgeSource(edgeId: EdgeId): NodeId;
  edgeTarget(edgeId: EdgeId): NodeId;
  nodeIds(): NodeId[];
  neighbors(nodeId: NodeId): NodeId[];
  predecessors(nodeId: NodeId): NodeId[];
  successors(nodeId: NodeId): NodeId[];
  inEdges(nodeId: NodeId): EdgeId[];
  outEdges(nodeId: NodeId): EdgeId[];
  edgesBetween(source: NodeId, target: NodeId): EdgeId[];
  setNodeAttributes(nodeId: NodeId, attributes: TgNodeAttributes): this;
  setEdge(
    edgeId: EdgeId,
    source: NodeId,
    target: NodeId,
    attributes: TgEdgeAttributes,
  ): this;
  removeNode(nodeId: NodeId): this;
  removeEdge(edgeId: EdgeId): this;
  getLegend(): EdgeId[];
}

export type AdapterOperations = Adapter & Operations;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type OperationsType = new (...args: any[]) => Operations;
