import { AdapterOperations } from '../../Operations/Operations.js';
import {
  NodeId,
  TgEdgeDirectionSemantic,
  TgNodeAttributes,
  isTgEdgeDirectionSemantic,
} from '../../TgGraph.js';
import { EdgeRule } from '../Rule.js';
import { EdgeRuleConfig } from '../RuleConfig.js';

type EdgeSemanticLegendEntry = {
  title: string;
  colour: string;
};

type EdgeSemanticLegendOptions = {
  legendBySemantic: Partial<Record<TgEdgeDirectionSemantic, EdgeSemanticLegendEntry>>;
  overwrite?: boolean;
};

export class EdgeSemanticLegend extends EdgeRule {
  constructor(config: EdgeRuleConfig) {
    if (config.options === undefined) {
      throw new Error(
        `Rule '${EdgeSemanticLegend.name}' requires options in config`,
      );
    }

    const options = config.options as Partial<EdgeSemanticLegendOptions>;

    if (
      typeof options.legendBySemantic !== 'object' ||
      options.legendBySemantic === null
    ) {
      throw new Error(
        `Rule '${EdgeSemanticLegend.name}' requires options.legendBySemantic`,
      );
    }

    for (const [semantic, legend] of Object.entries(options.legendBySemantic)) {
      if (!isTgEdgeDirectionSemantic(semantic)) {
        throw new Error(
          `Rule '${EdgeSemanticLegend.name}' has an invalid semantic key '${semantic}'`,
        );
      }
      if (
        typeof legend?.title !== 'string' ||
        typeof legend?.colour !== 'string'
      ) {
        throw new Error(
          `Rule '${EdgeSemanticLegend.name}' requires title and colour for semantic '${semantic}'`,
        );
      }
    }

    if (
      options.overwrite !== undefined &&
      typeof options.overwrite !== 'boolean'
    ) {
      throw new Error(
        `Rule '${EdgeSemanticLegend.name}' options.overwrite must be a boolean when provided`,
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

    const options = this.config.options as EdgeSemanticLegendOptions;
    const shouldOverwrite = options.overwrite ?? false;
    const edges = updated.outEdges(nodeId);

    for (const edgeId of edges) {
      const targetId = updated.edgeTarget(edgeId);
      const target = updated.getNodeAttributes(targetId);
      if (!target || !to.match(targetId, target, updated)) {
        continue;
      }

      const current = updated.getEdgeAttributes(edgeId);
      if (!isTgEdgeDirectionSemantic(current.directionSemantic)) {
        continue;
      }

      const legend = options.legendBySemantic[current.directionSemantic];
      if (!legend) {
        continue;
      }

      if (!shouldOverwrite && current.legend !== undefined) {
        continue;
      }

      updated = updated.setEdge(edgeId, nodeId, targetId, {
        ...current,
        legend: {
          title: legend.title,
          colour: legend.colour,
        },
      });
    }

    return updated;
  }
}

EdgeRule.register(EdgeSemanticLegend);
