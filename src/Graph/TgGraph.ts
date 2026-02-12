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

export type TgEdgeLegendAttribute = {
  label: string;
  // need to be explicit about styling fields? (for keys), or is that an Adapter specific thing?
};

export type TgEdgeRenderHints = {
  resource: string;
  name: string;
};

export interface TgEdgeAttributes extends Record<string, unknown> {
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

// probably DOT / graphviz  specific
// export type TgGraphRank = {
//   rankmode: string;
//   nodes: string[];
// };

export type TgNode = {
  //   shape: string; I think this is a rendering concern
  //   fontname: string; this is a rendering concern
  id: NodeId;
  label: string;
  adapter?: Record<string, Record<string, unknown>>;
  meta?: {
    resource: string;
    name: string;
  };
  parent?: {
    id: NodeId;
    isModule: boolean;
    nodeName?: string;
  };
};
export type TgNodeAttributes = Omit<TgNode, 'id'>;

// Pure-data internal graph model that can be JSON serialized.
export type TgGraph = {
  //   meta: TgGraphMeta; currently this is all DOT specific
  //   graph: TgGraphAttributes; DOT specific
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
): EdgeId => {
  const base = `${from}:${to}`;
  return (suffix ? `${base}:${suffix}` : base) as EdgeId;
};

export const asNodeId = (value: string): NodeId => value as NodeId;
export const asEdgeId = (value: string): EdgeId => value as EdgeId;
