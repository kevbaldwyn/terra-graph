import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { EdgeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class RemoveEdge extends EdgeHook {
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

EdgeHook.register(RemoveEdge);
