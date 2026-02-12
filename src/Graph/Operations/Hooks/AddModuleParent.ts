import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class AddModuleParent extends NodeHook {
  constructor() {
    super({
      node: {
        and: [
          { nodeId: { startsWith: 'cluster_module.' } },
          { attr: { key: 'label', exists: true } },
        ],
      },
    });
  }

  public override apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ) {
    if (!this.wasMatched(nodeId)) {
      return graph;
    }

    const prefix = `${node.label}.`;
    let updated = graph;

    // find nodes whose labels start with the matched module name
    // and apply some context data to them (parent)
    for (const childId of graph.nodeIds()) {
      if (childId === nodeId) {
        continue;
      }
      const child = updated.getNodeAttributes(childId);
      if (!child?.label?.startsWith(prefix)) {
        continue;
      }
      updated = updated.setNodeAttributes(childId, {
        ...child,
        parent: {
          id: nodeId,
          isModule: true,
          nodeName: `cluster_${node.label}`,
        },
      });
    }

    return updated;
  }
}

NodeHook.register(AddModuleParent);
