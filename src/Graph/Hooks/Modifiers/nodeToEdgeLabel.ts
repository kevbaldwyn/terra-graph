import { NodeModifier } from "../../../Nodes/Modifier.js";
import {
  htmlLabel,
  leafName,
  Node,
  NodeWithMeta,
  rootName,
} from "../../../Nodes/Node.js";

// TODO: pass in style options
export const nodeToEdgeLabel = (
  nodeList: string[]
): NodeModifier<NodeWithMeta> => ({
  describe: () => nodeToEdgeLabel.name,
  match: (nodeName, node) => {
    return nodeList.includes(node.meta?.resource ?? "");
  },
  modify: (nodeName, node, graph) => {
    const edges = graph.nodeEdges(nodeName);

    if (edges && edges.length == 2) {
      edges.forEach((edge: any) => {
        graph.removeEdge(edge);
      });
      graph.setEdge(edges[0].v, edges[1].w, {
        label: htmlLabel(rootName(edges[0].w), leafName(edges[0].w)),
        fontname: "sans-serif",
        fontsize: "10pt",
      });
      graph.removeNode(nodeName);
    }
  },
});
