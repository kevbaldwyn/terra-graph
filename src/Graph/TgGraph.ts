// this is DOT / graphviz specific?
// export type TgGraphMeta = {
//   directed: boolean;
//   multigraph: boolean;
//   compound: boolean;
// };

// DOT / graphviz specific?
// export type TgGraphAttributes = Record<string, string>;

export type NodeId = string & { readonly __brand: 'NodeId' };
export type EdgeId = string & { readonly __brand: 'EdgeId' };

export const TG_ID_NAMESPACE = 'tg';
export const TG_SCHEMA_VERSION = '1.0.0';

export type TgNodeKind =
  | 'resource'
  | 'data'
  | 'local'
  | 'var'
  | 'output'
  | 'module'
  | 'provider'
  | 'root'
  | 'meta'
  | 'terraform';

export type ParsedTgNodeId = {
  namespace: string;
  version: string;
  kind: string;
  address: string;
};

export type TgEdgeLegendAttribute = {
  title: string;
  colour: string;
};

export type TgEdgeRenderHints = {
  resource: string;
  name: string;
};

export const TgEdgeDirectionSemantics = {
  Invokes: 'invokes',
  Accesses: 'accesses',
  Publishes: 'publishes',
  Triggers: 'triggers',
  Routes: 'routes',
  Authorizes: 'authorizes',
  ObservedBy: 'observedBy',
} as const;

export type TgEdgeDirectionSemantic =
  (typeof TgEdgeDirectionSemantics)[keyof typeof TgEdgeDirectionSemantics];

export const TG_EDGE_DIRECTION_SEMANTICS = Object.freeze(
  Object.values(TgEdgeDirectionSemantics),
) as readonly TgEdgeDirectionSemantic[];

export const isTgEdgeDirectionSemantic = (
  value: unknown,
): value is TgEdgeDirectionSemantic => {
  return (
    typeof value === 'string' &&
    TG_EDGE_DIRECTION_SEMANTICS.includes(value as TgEdgeDirectionSemantic)
  );
};

export interface TgEdgeAttributes extends Record<string, unknown> {
  directionSemantic?: TgEdgeDirectionSemantic;
  legend?: TgEdgeLegendAttribute;
  renderHints?: TgEdgeRenderHints;
  adapter?: Record<string, Record<string, unknown>>;
}

export type TgEdge = {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  attributes?: TgEdgeAttributes;
};

export type TgNodeTerraform = {
  kind?: TgNodeKind;
  address?: string;
  resource?: string;
  name?: string;
  moduleAddress?: string;
  parentModuleName?: string;
  parentModuleNodeId?: NodeId;
};

// probably DOT / graphviz  specific
// export type TgGraphRank = {
//   rankmode: string;
//   nodes: string[];
// };

export type TgNodeAttributes = {
  terraform?: TgNodeTerraform;
  adapter?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
};

export type TgNode = {
  //   shape: string; I think this is a rendering concern
  //   fontname: string; this is a rendering concern
  id: NodeId;
} & TgNodeAttributes;

// Pure-data internal graph model that can be JSON serialized.
export type TgGraph = {
  //   meta: TgGraphMeta; currently this is all DOT specific
  //   graph: TgGraphAttributes; DOT specific
  schemaVersion: string;
  nodes: Record<string, TgNode>;
  // edges reference node ids to keep the model normalized.
  edges: TgEdge[];
  // ranks: TgGraphRank[]; are DOT-specific layout hints; omit from the core model for now.
  // legend: TgGraphLegend[]; // not sure about this, it could be gotten from the edges via a method
  description: Record<string, string>;
  // rootDir: string; is Graphviz-specific (used for resolving image paths) and excluded
  // from the internal model to keep it renderer-agnostic.
};

export const edgeIdFrom = (
  from: NodeId,
  to: NodeId,
  suffix?: string,
  version = TG_SCHEMA_VERSION,
): EdgeId => {
  const base = `${TG_ID_NAMESPACE}:${version}:edge:${from}->${to}`;
  return (suffix ? `${base}:${suffix}` : base) as EdgeId;
};

export const tgNodeIdFrom = (
  kind: TgNodeKind,
  address: string,
  version = TG_SCHEMA_VERSION,
): NodeId => `${TG_ID_NAMESPACE}:${version}:${kind}:${address}` as NodeId;

export const parseTgNodeId = (
  value: NodeId | string,
): ParsedTgNodeId | undefined => {
  const nodeId = String(value);
  const parts = nodeId.split(':');
  if (parts.length < 4) {
    return undefined;
  }
  const [namespace, version, kind, ...addressParts] = parts;
  if (namespace !== TG_ID_NAMESPACE || addressParts.length === 0) {
    return undefined;
  }
  return {
    namespace,
    version,
    kind,
    address: addressParts.join(':'),
  };
};

export const asNodeId = (value: string): NodeId => value as NodeId;
export const asEdgeId = (value: string): EdgeId => value as EdgeId;
