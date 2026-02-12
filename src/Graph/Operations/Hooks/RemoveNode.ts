import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class RemoveNode extends NodeHook {
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

NodeHook.register(RemoveNode);
