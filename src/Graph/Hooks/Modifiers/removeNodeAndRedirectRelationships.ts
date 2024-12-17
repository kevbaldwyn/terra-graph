import { NodeMatcher } from "../../../Nodes/Matcher.js";
import { NodeModifier } from "../../../Nodes/Modifier.js";
import { Node, NodeWithMeta } from "../../../Nodes/Node.js";

export const removeNodeAndRedirectRelationships = (
  match: NodeMatcher<NodeWithMeta>
): NodeModifier<NodeWithMeta> => ({
  describe: () => removeNodeAndRedirectRelationships.name,
  match,
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
