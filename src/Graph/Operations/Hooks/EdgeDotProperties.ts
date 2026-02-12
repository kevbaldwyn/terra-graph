import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { EdgeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';
import { EdgeHookConfig } from '../Hooks.js';

export class EdgeDotProperties extends EdgeHook {
  constructor(config: EdgeHookConfig) {
    if (config.options === undefined) {
      throw new Error(
        `Hook '${EdgeDotProperties.name}' requires options in config`,
      );
    }
    super(config);
  }

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

    let updated = graph;

    const { from, to } = this.query;
    if (!from.match(nodeId, node, updated)) {
      return updated;
    }

    const adapterKey = DotAdapter.name;
    const properties = this.config.options ?? {};

    const edges = updated.outEdges(nodeId);
    for (const edgeId of edges) {
      const targetId = updated.edgeTarget(edgeId);
      const target = updated.getNodeAttributes(targetId);
      if (!target || !to.match(targetId, target, updated)) {
        continue;
      }

      const current = updated.getEdgeAttributes(edgeId);
      updated = updated.setEdge(edgeId, nodeId, targetId, {
        ...current,
        adapter: {
          ...(current.adapter ?? {}),
          [adapterKey]: {
            ...(current.adapter?.[adapterKey] ?? {}),
            ...properties,
          },
        },
      });
    }

    return updated;
  }
}

EdgeHook.register(EdgeDotProperties);
