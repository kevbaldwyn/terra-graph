import { NodeId, TgNodeAttributes } from '../TgGraph.js';
import {
  EdgeRuleConfig,
  NodeRuleConfig,
  RuleConfig,
  SerializedRule,
} from './RuleConfig.js';
import { NodeQuery } from '../Operations/Matchers/NodeQuery/NodeQuery.js';
import { AdapterOperations } from '../Operations/Operations.js';

type RuleFactory = (config: RuleConfig) => BaseRule;
type RuleClass<TConfig extends RuleConfig> = new (
  config: TConfig,
  ...args: unknown[]
) => BaseRule<TConfig>;

export type EdgeRuleMatcher = { from: NodeQuery; to: NodeQuery };

export abstract class BaseRule<TConfig extends RuleConfig = RuleConfig> {
  private static registry: Record<string, RuleFactory> = {};
  private lastMatch = false;
  private lastMatchNodeId?: NodeId;

  protected abstract get query(): unknown;

  public static register<TConfig extends RuleConfig>(
    ruleClass: RuleClass<TConfig>,
  ) {
    BaseRule.registry[ruleClass.name] = (config) =>
      new ruleClass(config as TConfig);
  }

  public static fromSerialized(rule: SerializedRule): BaseRule {
    const factory = BaseRule.registry[rule.id];
    if (!factory) {
      throw new Error(`Rule '${rule.id}' is not registered`);
    }
    return factory(rule.config);
  }

  constructor(protected readonly config: TConfig) {}

  public describe(_nodeName: NodeId, _node: TgNodeAttributes): string {
    return this.getId();
  }

  public match(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): boolean {
    const result = this.matches(nodeId, node, graph);
    this.lastMatch = result;
    this.lastMatchNodeId = nodeId;
    return result;
  }

  protected abstract matches(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): boolean;

  public supports(_adapter: AdapterOperations): boolean {
    return true;
  }

  public abstract apply(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): AdapterOperations;

  public serialize(): SerializedRule {
    return {
      id: this.getId(),
      config: this.config,
    };
  }

  protected getId(): string {
    return this.constructor.name;
  }

  protected wasMatched(_nodeId: NodeId): boolean {
    return this.lastMatchNodeId === _nodeId && this.lastMatch;
  }
}

export abstract class NodeRule extends BaseRule<NodeRuleConfig> {
  private readonly queryValue: NodeQuery;

  constructor(config: NodeRuleConfig) {
    if (!('node' in config)) {
      throw new Error(`Rule '${new.target.name}' requires a node config`);
    }
    super(config);
    this.queryValue = NodeQuery.from(config.node);
  }

  protected get query(): NodeQuery {
    return this.queryValue;
  }

  protected matches(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): boolean {
    return this.query.match(nodeId, node, graph);
  }
}

export abstract class EdgeRule extends BaseRule<EdgeRuleConfig> {
  private readonly queryValue: EdgeRuleMatcher;

  constructor(config: EdgeRuleConfig) {
    if (!('edge' in config)) {
      throw new Error(`Rule '${new.target.name}' requires an edge config`);
    }
    super(config);
    this.queryValue = {
      from: NodeQuery.from(config.edge.from),
      to: NodeQuery.from(config.edge.to),
    };
  }

  protected get query(): EdgeRuleMatcher {
    return this.queryValue;
  }

  protected matches(
    nodeId: NodeId,
    node: TgNodeAttributes,
    graph: AdapterOperations,
  ): boolean {
    return this.query.from.match(nodeId, node, graph);
  }
}
