import { NodeFilter } from "../../../Nodes/Filter.js";
import { NodeWithMeta, rootName } from "../../../Nodes/Node.js";

export const excludeResourceExceptWhenInEdgeMatches = (
  map: Map<string, string[]>
): NodeFilter<NodeWithMeta> => ({
  describe: () => excludeResourceExceptWhenInEdgeMatches.name,
  match: (nodeName, node) => {
    return [...map.keys()].includes(node.meta?.resource ?? "");
  },
  remove: (nodeName, node, graph) => {
    const edges = graph.inEdges(nodeName);
    if (edges) {
      const matches = map.get(node.meta?.resource ?? "");
      for (const edge of edges) {
        if (matches?.includes(rootName(edge.v))) {
          return false;
        }
      }
    }
    return true;
  },
});
