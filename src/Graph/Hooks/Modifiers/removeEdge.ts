import { NodeMatchFn } from "../../../Nodes/Matcher";
import { NodeModifier } from "../../../Nodes/Modifier";
import { Node } from "../../../Nodes/Node";

export const removeEdge = <NodeType extends Node = Node>(
  matchers: {
    from: NodeMatchFn<boolean, NodeType>;
    to: NodeMatchFn<boolean, NodeType>;
  }[]
): NodeModifier<NodeType> => ({
  describe: () => removeEdge.name,
  match: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.from(nodeName, node, graph)) {
        return true;
      }
    }
    return false;
  },
  modify: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.from(nodeName, node, graph)) {
        const edges = graph.outEdges(nodeName);
        const nodes = [nodeName];
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
