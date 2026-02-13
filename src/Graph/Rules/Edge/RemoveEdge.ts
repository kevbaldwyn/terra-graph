import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { EdgeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class RemoveEdge extends EdgeRule {
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

    const edges = updated.outEdges(nodeId);
    for (const edgeId of edges) {
      const targetId = updated.edgeTarget(edgeId);
      const target = updated.getNodeAttributes(targetId);
      if (!target || !to.match(targetId, target, updated)) {
        continue;
      }
      updated = updated.removeEdge(edgeId);
    }

    return updated;
  }
}

EdgeRule.register(RemoveEdge);
