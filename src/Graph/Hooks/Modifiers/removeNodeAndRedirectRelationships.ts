import { NodeMatcher } from "../../../Nodes/Matcher.js";
import { NodeModifier } from "../../../Nodes/Modifier.js";
import { NodeWithMeta } from "../../../Nodes/Node.js";

export const removeNodeAndRedirectRelationships = (
  matches: string[] | NodeMatcher<NodeWithMeta>
): NodeModifier<NodeWithMeta> => ({
  describe: () => removeNodeAndRedirectRelationships.name,
  match: (nodeName, node, graph) => {
    if (typeof matches === "function") {
      return matches(nodeName, node, graph);
    } else {
      return (
        matches.includes(node.meta?.resource ?? "") ||
        matches.includes(nodeName)
      );
    }
  },
  modify: (nodeName, node, graph) => {
    const inEdges = graph.inEdges(nodeName) ?? [];
    const outEdges = graph.outEdges(nodeName) ?? [];
    if (outEdges.length > inEdges.length) {
      inEdges.forEach((inEdge) => {
        outEdges.forEach((outEdge) => {
          graph.setEdge(inEdge.v, outEdge.w);
        });
      });
    } else {
      outEdges.forEach((inEdge) => {
        inEdges.forEach((outEdge) => {
          graph.setEdge(inEdge.v, outEdge.w);
        });
      });
    }
    graph.removeNode(nodeName);
  },
});
