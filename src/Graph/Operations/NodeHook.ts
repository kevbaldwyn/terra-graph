import { NodeId, TgNodeAttributes } from '../TgGraph.js';
import {
  EdgeHookConfig,
  HookConfig,
  NodeHookConfig,
  SerializedHook,
} from './Hooks.js';
import { NodeQuery } from './Matchers/NodeQuery/NodeQuery.js';
import { AdapterOperations } from './Operations.js';

type HookFactory = (config: HookConfig) => BaseHook;
type HookClass<TConfig extends HookConfig> = new (
  config: TConfig,
  ...args: unknown[]
) => BaseHook<TConfig>;

export type EdgeHookMatcher = { from: NodeQuery; to: NodeQuery };

export abstract class BaseHook<TConfig extends HookConfig = HookConfig> {
  private static registry: Record<string, HookFactory> = {};
  private lastMatch = false;
  private lastMatchNodeId?: NodeId;

  protected abstract get query(): unknown;

  public static register<TConfig extends HookConfig>(
    hookClass: HookClass<TConfig>,
  ) {
    BaseHook.registry[hookClass.name] = (config) =>
      new hookClass(config as TConfig);
  }

  public static fromSerialized(hook: SerializedHook): BaseHook {
    const factory = BaseHook.registry[hook.id];
    if (!factory) {
      throw new Error(`Hook '${hook.id}' is not registered`);
    }
    return factory(hook.config);
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

  public serialize(): SerializedHook {
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

export abstract class NodeHook extends BaseHook<NodeHookConfig> {
  private readonly queryValue: NodeQuery;

  constructor(config: NodeHookConfig) {
    if (!('node' in config)) {
      throw new Error(`Hook '${new.target.name}' requires a node config`);
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

export abstract class EdgeHook extends BaseHook<EdgeHookConfig> {
  private readonly queryValue: EdgeHookMatcher;

  constructor(config: EdgeHookConfig) {
    if (!('edge' in config)) {
      throw new Error(`Hook '${new.target.name}' requires an edge config`);
    }
    super(config);
    this.queryValue = {
      from: NodeQuery.from(config.edge.from),
      to: NodeQuery.from(config.edge.to),
    };
  }

  protected get query(): EdgeHookMatcher {
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
