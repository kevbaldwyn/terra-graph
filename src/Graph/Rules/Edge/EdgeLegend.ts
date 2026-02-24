import { AdapterOperations } from '../../Operations/Operations.js';
import { NodeId, TgNodeAttributes } from '../../TgGraph.js';
import { EdgeRule } from '../Rule.js';
import { EdgeRuleConfig } from '../RuleConfig.js';

type EdgeLegendOptions = {
  title: string;
  colour: string;
};

export class EdgeLegend extends EdgeRule {
  constructor(config: EdgeRuleConfig) {
    if (config.options === undefined) {
      throw new Error(`Rule '${EdgeLegend.name}' requires options in config`);
    }

    const options = config.options as Partial<EdgeLegendOptions>;
    if (
      typeof options.title !== 'string' ||
      typeof options.colour !== 'string'
    ) {
      throw new Error(
        `Rule '${EdgeLegend.name}' requires options.title and options.colour`,
      );
    }

    super(config);
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

    const options = this.config.options as EdgeLegendOptions;

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
        legend: {
          title: options.title,
          colour: options.colour,
        },
      });
    }

    return updated;
  }
}

EdgeRule.register(EdgeLegend);
