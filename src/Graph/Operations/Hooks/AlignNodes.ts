import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { EdgeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class AlignNodes extends EdgeHook {
  public override supports(adapter: AdapterOperations): boolean {
    return adapter instanceof DotAdapter;
  }

  public override apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): AdapterOperations {
    if (!this.wasMatched(nodeId)) {
      return graph;
    }

    let updated = graph as DotAdapter;

    const { from, to } = this.query;

    if (!from.match(nodeId, node, updated)) {
      return updated;
    }

    const edgeIds = updated.outEdges(nodeId);
    const nodes: NodeId[] = [nodeId];

    for (const edgeId of edgeIds) {
      const targetId = updated.edgeTarget(edgeId);
      const target = updated.getNodeAttributes(targetId);
      if (!target || !to.match(targetId, target, updated)) {
        continue;
      }

      nodes.push(targetId);
      updated = updated.setEdge(edgeId, nodeId, targetId, {
        ...updated.getEdgeAttributes(edgeId),
      }) as DotAdapter;
    }

    if (nodes.length > 1) {
      updated = updated.addRank(nodes, 'same');
    }

    return updated;
  }
}

EdgeHook.register(AlignNodes);
