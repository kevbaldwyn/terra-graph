import { NodeId, TgNodeAttributes, edgeIdFrom } from '../../TgGraph.js';
import { EdgeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class ExplicitEdge extends EdgeHook {
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

    for (const targetId of updated.nodeIds()) {
      const target = updated.getNodeAttributes(targetId);
      if (!target || !to.match(targetId, target, updated)) {
        continue;
      }

      const edgeId = edgeIdFrom(nodeId, targetId);
      updated = updated.setEdge(edgeId, nodeId, targetId, {});
    }

    return updated;
  }
}

EdgeHook.register(ExplicitEdge);
