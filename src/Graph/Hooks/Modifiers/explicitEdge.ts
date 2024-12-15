import { NodeModifier } from "../../../Nodes/Modifier";
import { Node } from "../../../Nodes/Node";

export const explicitEdge = (
  map: Map<string, { in?: string[]; out?: string[] }>
): NodeModifier<Node> => ({
  describe: () => explicitEdge.name,
  match: (nodeName) => {
    return [...map.keys()].includes(nodeName);
  },
  modify: (nodeName, node, graph) => {
    const match = map.get(nodeName);
    (match!.in ?? []).forEach((n) => {
      graph.setEdge(n, nodeName);
    });
    (match!.out ?? []).forEach((n) => {
      graph.setEdge(nodeName, n);
    });
  },
});
