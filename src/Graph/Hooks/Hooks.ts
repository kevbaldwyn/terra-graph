import { NodeFilter } from "../../Nodes/Filter.js";
import { NodeModifier } from "../../Nodes/Modifier.js";
import { Node, NodeWithParent } from "../../Nodes/Node.js";

export enum Hook {
  META_BEFORE = "meta.before",
  META_APPLY = "meta.apply",
  GRAPH_FILTER = "graph.filter",
  GRAPH_DECORATE = "graph.decorate",
}

export type HookMap = {
  [Hook.META_BEFORE]?: NodeFilter<Node>[];
  [Hook.META_APPLY]?: NodeModifier<Node>[];
  [Hook.GRAPH_FILTER]?: NodeFilter<NodeWithParent>[];
  [Hook.GRAPH_DECORATE]?: NodeModifier<NodeWithParent>[];
};

type Hooks = NodeModifier<Node> | NodeFilter<Node>;

export const getHooks = <HookType = Hooks>(
  hookStep: Hook,
  map: HookMap
): HookType[] => {
  // TODO: runtime guards validating hooks
  return map[hookStep] as HookType[];
};

export const extend = (source: HookMap, extension: HookMap): HookMap => {
  return {
    [Hook.META_BEFORE]: [
      ...(source[Hook.META_BEFORE] ?? []),
      ...(extension[Hook.META_BEFORE] ?? []),
    ],
    [Hook.META_APPLY]: [
      ...(source[Hook.META_APPLY] ?? []),
      ...(extension[Hook.META_APPLY] ?? []),
    ],
    [Hook.GRAPH_FILTER]: [
      ...(source[Hook.GRAPH_FILTER] ?? []),
      ...(extension[Hook.GRAPH_FILTER] ?? []),
    ],
    [Hook.GRAPH_DECORATE]: [
      ...(source[Hook.GRAPH_DECORATE] ?? []),
      ...(extension[Hook.GRAPH_DECORATE] ?? []),
    ],
  };
};

export const replace = <H extends Hook>(
  hook: H,
  map: HookMap,
  newHooks: HookMap[H]
): HookMap => {
  return {
    ...map,
    [hook]: newHooks,
  };
};
