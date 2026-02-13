import { NodeId, TgNodeAttributes, edgeIdFrom } from '../../TgGraph.js';
import { NodeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class RemoveNodeAndReconnectEdges extends NodeRule {
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

    let updated = graph;

    if (outEdges.length > inEdges.length) {
      for (const inEdgeId of inEdges) {
        const sourceId = updated.edgeSource(inEdgeId);
        for (const outEdgeId of outEdges) {
          const targetId = updated.edgeTarget(outEdgeId);
          const edgeId = edgeIdFrom(
            sourceId,
            targetId,
            `redirect:${inEdgeId}:${outEdgeId}`,
          );
          updated = updated.setEdge(edgeId, sourceId, targetId, {});
        }
      }
    } else {
      for (const outEdgeId of outEdges) {
        const targetId = updated.edgeTarget(outEdgeId);
        for (const inEdgeId of inEdges) {
          const sourceId = updated.edgeSource(inEdgeId);
          const edgeId = edgeIdFrom(
            sourceId,
            targetId,
            `redirect:${inEdgeId}:${outEdgeId}`,
          );
          updated = updated.setEdge(edgeId, sourceId, targetId, {});
        }
      }
    }

    return updated.removeNode(nodeId);
  }
}

NodeRule.register(RemoveNodeAndReconnectEdges);
