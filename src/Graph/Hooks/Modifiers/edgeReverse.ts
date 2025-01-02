import { Matcher, NodeMatcher } from "../../../Nodes/Matcher.js";
import { NodeModifier } from "../../../Nodes/Modifier.js";
import { EdgeOptions, NodeWithMeta } from "../../../Nodes/Node.js";

export const edgeReverse = <NodeType extends NodeWithMeta>(
  matchers: {
    from: NodeMatcher<NodeType>;
    to: NodeMatcher<NodeType>;
  }[],
  edgeOptions: EdgeOptions = {}
): NodeModifier<NodeType> => {
  return {
    describe: () => edgeReverse.name,
    match: Matcher.edge.fromTo(matchers),
    modify: (nodeName, node, graph) => {
      for (const matcher of matchers) {
        // for each match
        if (matcher.from(nodeName, node, graph)) {
          // get all the edges going from the match to another node
          const inEdges = graph.inEdges(nodeName);
          if (inEdges) {
            inEdges.forEach((edge: any) => {
              const edgeNode: NodeType = graph.node(edge.v);
              // if the to node matches the rule then reverse the relationship
              if (matcher.to(edge.v, edgeNode, graph)) {
                graph.setEdge(edge.w, edge.v, { ...edgeOptions });
                graph.removeEdge(edge.v, edge.w);
                graph.addKey(edgeOptions);
              }
            });
          }
        }
      }
    },
  };
};
