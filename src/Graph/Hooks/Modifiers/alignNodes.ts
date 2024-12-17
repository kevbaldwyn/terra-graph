import { Matcher, NodeMatcher } from "../../../Nodes/Matcher.js";
import { NodeModifier } from "../../../Nodes/Modifier.js";
import { Node } from "../../../Nodes/Node.js";

export const alignNodes = <NodeType extends Node>(
  matchers: {
    from: NodeMatcher<NodeType>;
    to: NodeMatcher<NodeType>;
  }[]
): NodeModifier<NodeType> => ({
  describe: () => alignNodes.name,
  match: Matcher.edge.fromTo(matchers),
  modify: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.from(nodeName, node, graph)) {
        const edges = graph.outEdges(nodeName);
        const nodes = [nodeName];
        if (edges) {
          for (const edge of edges) {
            const edgeNode = graph.node(edge.w);
            if (matcher.to(edge.w, edgeNode, graph)) {
              nodes.push(edge.w);
            }
          }
          if (nodes.length > 1) {
            graph.addRank({ rankmode: "same", nodes });
          }
        }
        break;
      }
    }
  },
});
