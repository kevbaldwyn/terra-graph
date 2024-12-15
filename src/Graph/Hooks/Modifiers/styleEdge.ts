import { NodeModifier } from "../../../Nodes/Modifier.js";
import { NodeWithMeta } from "../../../Nodes/Node.js";

export const styleEdge = (
  edgeMap: Map<string, string[]>,
  edgeOptions: Record<string, string>
): NodeModifier<NodeWithMeta> => ({
  describe: () => styleEdge.name,
  match: (nodeName, node) => {
    const keys = [...edgeMap.keys()];
    return keys.includes(node.meta?.resource ?? "") || keys.includes(nodeName);
  },
  modify: (nodeName, node, graph) => {
    const matches =
      edgeMap.get(node.meta?.resource ?? "") ?? edgeMap.get(nodeName);
    const edges = graph.outEdges(nodeName) ?? [];

    edges.forEach((edge) => {
      const edgeNodeName = edge.w;
      const edgeNode: NodeWithMeta = graph.node(edgeNodeName);

      // if the node at the edge matches
      if (
        matches?.includes(edgeNode.meta?.resource ?? "") ||
        matches?.includes(edgeNodeName)
      ) {
        // update the edge properties (merge with cirrent props)
        const currentEdge = graph.edge(edge.v, edge.w);
        graph.setEdge(edge.v, edge.w, { ...currentEdge, ...edgeOptions });
      }
    });
  },
});
