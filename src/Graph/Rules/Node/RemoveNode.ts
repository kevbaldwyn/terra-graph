import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class RemoveNode extends NodeRule {
  public override apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ) {
    if (!this.wasMatched(nodeId)) {
      return graph;
    }
    return graph.removeNode(nodeId);
  }
}

NodeRule.register(RemoveNode);
