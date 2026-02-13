import { NodeId, TgNodeAttributes, edgeIdFrom } from '../../TgGraph.js';
import { NodeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class ConvertNodeToEdge extends NodeRule {
  public override apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): AdapterOperations {
    if (!this.wasMatched(nodeId)) {
      return graph;
    }

    const inEdges = graph.inEdges(nodeId);
    const outEdges = graph.outEdges(nodeId);
    if (inEdges.length !== 1 || outEdges.length !== 1) {
      return graph;
    }

    const inEdgeId = inEdges[0];
    const outEdgeId = outEdges[0];
    const sourceId = graph.edgeSource(inEdgeId);
    const targetId = graph.edgeTarget(outEdgeId);

    const renderHints = {
      resource: node.meta?.resource ?? node.label.split('.')[0] ?? '',
      name: node.meta?.name ?? node.label.split('.').pop() ?? '',
    };

    let updated = graph.removeEdge(inEdgeId).removeEdge(outEdgeId);
    const edgeId = edgeIdFrom(sourceId, targetId);
    updated = updated.setEdge(edgeId, sourceId, targetId, { renderHints });
    updated = updated.removeNode(nodeId);

    return updated;
  }
}

NodeRule.register(ConvertNodeToEdge);
