import { Hook } from '../Hooks/Hooks.js';
import { NodeId, TgNodeAttributes } from '../TgGraph.js';
import { QueryDsl } from './Matchers/NodeQuery/QuerySchema.js';
import { BaseHook } from './NodeHook.js';
import { AdapterOperations } from './Operations.js';

// export { NodeHook } from './NodeHook.js';

export type NodeModifyFn = (
  nodeId: NodeId,
  node: TgNodeAttributes,
  graph: AdapterOperations,
) => AdapterOperations;

export type HookMap = {
  [Hook.META_BEFORE]?: BaseHook[];
  [Hook.META_APPLY]?: BaseHook[];
  [Hook.GRAPH_FILTER]?: BaseHook[];
  [Hook.GRAPH_DECORATE]?: BaseHook[];
};

// TODO: revist hook life-cycle and what they are for and when to use them (and what they are called)
type HookTypes = {
  [Hook.META_BEFORE]: BaseHook;
  [Hook.META_APPLY]: BaseHook;
  [Hook.GRAPH_FILTER]: BaseHook;
  [Hook.GRAPH_DECORATE]: BaseHook;
};

export type NodeHookConfig = {
  node: QueryDsl;
  options?: Record<string, unknown>;
};
export type EdgeHookQuery = { from: QueryDsl; to: QueryDsl };
export type EdgeHookConfig = {
  edge: EdgeHookQuery;
  options?: Record<string, unknown>;
};
export type HookConfig = NodeHookConfig | EdgeHookConfig;

export type SerializedHook = {
  id: string;
  config: HookConfig;
};

export type SerializedHookMap = {
  [Hook.META_BEFORE]?: SerializedHook[];
  [Hook.META_APPLY]?: SerializedHook[];
  [Hook.GRAPH_FILTER]?: SerializedHook[];
  [Hook.GRAPH_DECORATE]?: SerializedHook[];
};

export type Plugin = () => HookMap;

export const getHooks = <HookStep extends Hook>(
  hookStep: HookStep,
  map: HookMap,
): HookTypes[HookStep][] => {
  return (map[hookStep] ?? []) as HookTypes[HookStep][];
};
