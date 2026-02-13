import { NodeId, TgEdgeAttributes, TgNodeAttributes } from '../../TgGraph.js';
import { EdgeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class EdgeReverse extends EdgeRule {
  public override apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): AdapterOperations {
    if (!this.wasMatched(nodeId)) {
      return graph;
    }

    let updated = graph;

    const { from, to } = this.query;

    if (!from.match(nodeId, node, updated)) {
      return updated;
    }

    const inEdgeIds = updated.inEdges(nodeId);
    for (const edgeId of inEdgeIds) {
      const sourceId = updated.edgeSource(edgeId);
      const source = updated.getNodeAttributes(sourceId);
      if (!source || !to.match(sourceId, source, updated)) {
        continue;
      }

      updated = updated.removeEdge(edgeId).setEdge(edgeId, nodeId, sourceId, {
        ...updated.getEdgeAttributes(edgeId),
      });
    }

    return updated;
  }
}

EdgeRule.register(EdgeReverse);
