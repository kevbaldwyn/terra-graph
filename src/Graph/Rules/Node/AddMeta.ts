import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class AddMeta extends NodeRule {
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

NodeRule.register(AddMeta);
