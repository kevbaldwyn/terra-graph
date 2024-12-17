import { Matcher, NodeMatcher } from "../../../Nodes/Matcher.js";
import { NodeModifier } from "../../../Nodes/Modifier.js";
import { Node } from "../../../Nodes/Node.js";

export const removeEdge = <NodeType extends Node = Node>(
  matchers: {
    from: NodeMatcher<NodeType>;
    to: NodeMatcher<NodeType>;
  }[]
): NodeModifier<NodeType> => ({
  describe: () => removeEdge.name,
  match: Matcher.edge.fromTo(matchers),
  modify: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.from(nodeName, node, graph)) {
        const edges = graph.outEdges(nodeName);
        if (edges) {
          for (const edge of edges) {
            const edgeNode = graph.node(edge.w);
            if (matcher.to(edge.w, edgeNode, graph)) {
              graph.removeEdge(edge);
            }
          }
        }
        break;
      }
    }
  },
});
