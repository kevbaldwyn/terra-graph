import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { NodeRuleConfig } from '../RuleConfig.js';
import { NodeRule } from '../Rule.js';
import { AdapterOperations } from '../../Operations/Operations.js';

export class NodeDotProperties extends NodeRule {
  // private static readonly defaultConfig: NodeRuleConfig = {
  //   node: {
  //     and: [
  //       { nodeId: { startsWith: 'cluster_module.' } },
  //       { attr: { key: 'label', exists: true } },
  //     ],
  //   },
  // };

  constructor(config: NodeRuleConfig) {
    if (config.options === undefined) {
      throw new Error(
        `Rule '${NodeDotProperties.name}' requires options in config`,
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

NodeRule.register(NodeDotProperties);
