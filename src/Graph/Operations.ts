import type { EdgeId, NodeId } from './TgGraph.js';

// Minimal traversal/mutation surface for hooks/plugins to depend on.
export interface Operations<
  NodeAttributes = Record<string, unknown>,
  EdgeAttributes = Record<string, unknown>
> {
  getNodeAttributes(nodeId: NodeId): NodeAttributes | undefined;
  getEdgeAttributes(edgeId: EdgeId): EdgeAttributes;
  edgeSource(edgeId: EdgeId): NodeId;
  edgeTarget(edgeId: EdgeId): NodeId;
  neighbors(nodeId: NodeId): NodeId[];
  predecessors(nodeId: NodeId): NodeId[];
  successors(nodeId: NodeId): NodeId[];
  inEdges(nodeId: NodeId): EdgeId[];
  outEdges(nodeId: NodeId): EdgeId[];
  edgesBetween(source: NodeId, target: NodeId): EdgeId[];
  setNodeAttributes(
    nodeId: NodeId,
    attributes: NodeAttributes,
  ): Operations<NodeAttributes, EdgeAttributes>;
  setEdge(
    edgeId: EdgeId,
    source: NodeId,
    target: NodeId,
    attributes: EdgeAttributes,
  ): Operations<NodeAttributes, EdgeAttributes>;
  removeNode(nodeId: NodeId): Operations<NodeAttributes, EdgeAttributes>;
  removeEdge(edgeId: EdgeId): Operations<NodeAttributes, EdgeAttributes>;
  getLegend(): EdgeId[];
}
