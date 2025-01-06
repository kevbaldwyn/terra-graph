import { Matcher, NodeMatcher } from '../../../Nodes/Matcher.js';
import { NodeModifier } from '../../../Nodes/Modifier.js';
import { EdgeOptions, NodeWithMeta } from '../../../Nodes/Node.js';

export const styleEdge = <NodeType extends NodeWithMeta>(
  matchers: {
    from: NodeMatcher<NodeType>;
    to: NodeMatcher<NodeType>;
  }[],
  edgeOptions: EdgeOptions,
): NodeModifier<NodeType> => ({
  describe: () => styleEdge.name,
  match: Matcher.edge.fromTo(matchers),
  modify: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.from(nodeName, node, graph)) {
        const edges = graph.outEdges(nodeName) ?? [];

        for (const edge of edges) {
          const edgeNodeName = edge.w;
          const edgeNode: NodeType = graph.node(edgeNodeName);

          if (matcher.to(edgeNodeName, edgeNode, graph)) {
            // if the node at the edge matches
            // update the edge properties (merge with cirrent props)
            const currentEdge = graph.edge(edge.v, edge.w);
            graph.setEdge(edge.v, edge.w, { ...currentEdge, ...edgeOptions });
            graph.addKey(edgeOptions);
          }
        }
      }
    }
  },
});
