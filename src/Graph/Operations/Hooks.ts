import { Hook } from '../Hooks/Hooks.js';
import { Operations } from './Operations.js';
import { NodeId } from '../TgGraph.js';

export type NodeMatchFn<
  NodeAttributes extends Record<string, unknown> = Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown> = Record<string, unknown>,
> = (
  nodeId: NodeId,
  node: NodeAttributes,
  graph: Operations<NodeAttributes, EdgeAttributes>,
) => boolean;

export type NodeModifyFn<
  NodeAttributes extends Record<string, unknown> = Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown> = Record<string, unknown>,
> = (
  nodeId: NodeId,
  node: NodeAttributes,
  graph: Operations<NodeAttributes, EdgeAttributes>,
) => Operations<NodeAttributes, EdgeAttributes>;

export type NodeHook<
  NodeAttributes extends Record<string, unknown> = Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown> = Record<string, unknown>,
> = {
  describe?: (nodeName: NodeId, node: NodeAttributes) => string;
  match: NodeMatchFn<NodeAttributes, EdgeAttributes>;
  apply: NodeModifyFn<NodeAttributes, EdgeAttributes>;
  serialize: () => SerializedHook;
};

export type HookMap<
  NodeAttributes extends Record<string, unknown> = Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown> = Record<string, unknown>,
> = {
  [Hook.META_BEFORE]?: NodeHook<NodeAttributes, EdgeAttributes>[];
  [Hook.META_APPLY]?: NodeHook<NodeAttributes, EdgeAttributes>[];
  [Hook.GRAPH_FILTER]?: NodeHook<NodeAttributes, EdgeAttributes>[];
  [Hook.GRAPH_DECORATE]?: NodeHook<NodeAttributes, EdgeAttributes>[];
};

// TODO: revist hook life-cycle and what they are for and when to use them (and what they are called)
type HookTypes<
  NodeAttributes extends Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown>,
> = {
  [Hook.META_BEFORE]: NodeHook<NodeAttributes, EdgeAttributes>;
  [Hook.META_APPLY]: NodeHook<NodeAttributes, EdgeAttributes>;
  [Hook.GRAPH_FILTER]: NodeHook<NodeAttributes, EdgeAttributes>;
  [Hook.GRAPH_DECORATE]: NodeHook<NodeAttributes, EdgeAttributes>;
};

export type SerializedHook = {
  id: string;
  config?: Record<string, unknown>;
};

export type SerializedHookMap = {
  [Hook.META_BEFORE]?: SerializedHook[];
  [Hook.META_APPLY]?: SerializedHook[];
  [Hook.GRAPH_FILTER]?: SerializedHook[];
  [Hook.GRAPH_DECORATE]?: SerializedHook[];
};

export type Plugin<
  NodeAttributes extends Record<string, unknown> = Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown> = Record<string, unknown>,
> = () => HookMap<NodeAttributes, EdgeAttributes>;

export const getHooks = <
  HookStep extends Hook,
  NodeAttributes extends Record<string, unknown> = Record<string, unknown>,
  EdgeAttributes extends Record<string, unknown> = Record<string, unknown>,
>(
  hookStep: HookStep,
  map: HookMap<NodeAttributes, EdgeAttributes>,
): HookTypes<NodeAttributes, EdgeAttributes>[HookStep][] => {
  return (map[hookStep] ?? []) as HookTypes<
    NodeAttributes,
    EdgeAttributes
  >[HookStep][];
};
