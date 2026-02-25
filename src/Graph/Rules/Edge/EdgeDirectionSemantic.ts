import { AdapterOperations } from '../../Operations/Operations.js';
import {
  NodeId,
  TgNodeAttributes,
  TgEdgeDirectionSemantic,
  isTgEdgeDirectionSemantic,
} from '../../TgGraph.js';
import { EdgeRule } from '../Rule.js';
import { EdgeRuleConfig } from '../RuleConfig.js';

type EdgeDirectionSemanticOptions = {
  semantic: TgEdgeDirectionSemantic;
  overwrite?: boolean;
  enforceDirection?: boolean;
};

export class EdgeDirectionSemantic extends EdgeRule {
  constructor(config: EdgeRuleConfig) {
    if (config.options === undefined) {
      throw new Error(
        `Rule '${EdgeDirectionSemantic.name}' requires options in config`,
      );
    }

    const options = config.options as Partial<EdgeDirectionSemanticOptions>;
    if (!isTgEdgeDirectionSemantic(options.semantic)) {
      throw new Error(
        `Rule '${EdgeDirectionSemantic.name}' requires options.semantic`,
      );
    }

    if (
      options.overwrite !== undefined &&
      typeof options.overwrite !== 'boolean'
    ) {
      throw new Error(
        `Rule '${EdgeDirectionSemantic.name}' options.overwrite must be a boolean when provided`,
      );
    }

    if (
      options.enforceDirection !== undefined &&
      typeof options.enforceDirection !== 'boolean'
    ) {
      throw new Error(
        `Rule '${EdgeDirectionSemantic.name}' options.enforceDirection must be a boolean when provided`,
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

    const options = this.config.options as EdgeDirectionSemanticOptions;
    const shouldOverwrite = options.overwrite ?? false;
    const shouldEnforceDirection = options.enforceDirection ?? false;
    const edges = updated.outEdges(nodeId);

    for (const edgeId of edges) {
      const targetId = updated.edgeTarget(edgeId);
      const target = updated.getNodeAttributes(targetId);
      if (!target || !to.match(targetId, target, updated)) {
        continue;
      }

      const current = updated.getEdgeAttributes(edgeId);
      if (!shouldOverwrite && current.directionSemantic !== undefined) {
        continue;
      }

      updated = updated.setEdge(edgeId, nodeId, targetId, {
        ...current,
        directionSemantic: options.semantic,
      });
    }

    if (!shouldEnforceDirection) {
      return updated;
    }

    const inboundEdgeIds = updated.inEdges(nodeId);
    for (const edgeId of inboundEdgeIds) {
      const sourceId = updated.edgeSource(edgeId);
      const source = updated.getNodeAttributes(sourceId);
      if (!source || !to.match(sourceId, source, updated)) {
        continue;
      }

      const current = updated.getEdgeAttributes(edgeId);
      if (
        !shouldOverwrite &&
        current.directionSemantic !== undefined &&
        current.directionSemantic !== options.semantic
      ) {
        continue;
      }

      updated = updated.removeEdge(edgeId).setEdge(edgeId, nodeId, sourceId, {
        ...current,
        directionSemantic: options.semantic,
      });
    }

    return updated;
  }
}

EdgeRule.register(EdgeDirectionSemantic);
