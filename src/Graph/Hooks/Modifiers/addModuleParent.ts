import { NodeModifier } from "../../../Nodes/Modifier.js";
import { Node } from "../../../Nodes/Node.js";
import { Graph } from "../../Graph.js";

export const addModuleParent = (): NodeModifier<Node> => ({
  describe: () => addModuleParent.name,
  match: (nodeName: string) => {
    return nodeName.startsWith("cluster_module.");
  },
  modify: (nodeName, node, graph: Graph) => {
    // console.log(node);
    graph.children(`cluster_${node.label}`).forEach((child: string) => {
      const childNode = graph.node(child);
      childNode.parent = {
        nodeName: `cluster_${node.label}`,
        node,
        label: node.label,
        isModule: true,
      };
    });
  },
});
