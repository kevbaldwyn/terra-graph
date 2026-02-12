import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class AddMeta extends NodeHook {
  public override apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ) {
    if (!this.wasMatched(nodeId)) {
      return graph;
    }

    const [resource, name] = node.label.split('.') as string[];
    return graph.setNodeAttributes(nodeId, {
      ...node,
      meta: {
        resource,
        name,
      },
    });
  }
}

NodeHook.register(AddMeta);
