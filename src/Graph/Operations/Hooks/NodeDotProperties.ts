import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeHookConfig } from '../Hooks.js';
import { NodeHook } from '../NodeHook.js';
import { AdapterOperations } from '../Operations.js';

export class NodeDotProperties extends NodeHook {
  // private static readonly defaultConfig: NodeHookConfig = {
  //   node: {
  //     and: [
  //       { nodeId: { startsWith: 'cluster_module.' } },
  //       { attr: { key: 'label', exists: true } },
  //     ],
  //   },
  // };

  constructor(config: NodeHookConfig) {
    if (config.options === undefined) {
      throw new Error(
        `Hook '${NodeDotProperties.name}' requires options in config`,
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

    const adapterKey = DotAdapter.name;
    const properties = this.config.options ?? {};

    return graph.setNodeAttributes(nodeId, {
      ...node,
      adapter: {
        ...(node.adapter ?? {}),
        [adapterKey]: {
          ...(node.adapter?.[adapterKey] ?? {}),
          ...properties,
        },
      },
    });
  }
}

NodeHook.register(NodeDotProperties);
