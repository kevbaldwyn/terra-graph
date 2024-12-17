import { NodeFilter } from "../../../Nodes/Filter.js";
import { NodeMatcher } from "../../../Nodes/Matcher.js";
import { NodeWithMeta } from "../../../Nodes/Node.js";

export const excludeResourceExceptWhenInEdgeMatches = <
  NodeType extends NodeWithMeta
>(
  matchers: {
    node: NodeMatcher<NodeType>;
    in: NodeMatcher<NodeType>;
  }[]
): NodeFilter<NodeType> => ({
  describe: () => excludeResourceExceptWhenInEdgeMatches.name,
  match: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.node(nodeName, node, graph)) {
        return true;
      }
    }
    return false;
  },
  remove: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.node(nodeName, node, graph)) {
        const edges = graph.inEdges(nodeName);
        if (edges) {
          for (const edge of edges) {
            const edgeNode = graph.node(edge.v);
            if (matcher.in(edge.v, edgeNode, graph)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  },
});
