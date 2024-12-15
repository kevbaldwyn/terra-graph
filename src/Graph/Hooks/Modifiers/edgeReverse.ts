import { NodeModifier } from "../../../Nodes/Modifier.js";
import { NodeWithMeta } from "../../../Nodes/Node.js";

//TODO: make it more flexible - ie not just by resource type?
export const edgeReverse = (
  edgeMap: Map<string, string[]>,
  edgeOptions: Record<string, unknown> = {}
): NodeModifier<NodeWithMeta> => {
  return {
    describe: () => edgeReverse.name,
    match: (nodeName, node) => {
      const keys = [...edgeMap.keys()];
      return (
        keys.includes(node.meta?.resource ?? "") || keys.includes(nodeName)
      );
    },
    modify: (nodeName, node, graph) => {
      // console.log(nodeName);
      const matches =
        edgeMap.get(node.meta?.resource ?? "") ?? edgeMap.get(nodeName);

      const inEdges = graph.inEdges(nodeName);
      // const outEdges = graph.outEdges(nodeName);
      if (nodeName.endsWith("kraken_copy_schedule")) {
        console.log(inEdges);
      }
      if (inEdges) {
        inEdges.forEach((edge: any) => {
          const edgeNode: NodeWithMeta = graph.node(edge.v);
          if (matches?.includes(edgeNode.meta?.resource ?? "")) {
            graph.setEdge(edge.w, edge.v, { ...edgeOptions });
            graph.removeEdge(edge.v, edge.w);
          }
        });
      }

      // if (outEdges) {
      //   console.log(outEdges);
      //   outEdges.forEach((edge: any) => {
      //     const edgeNode: NodeWithMeta = graph.node(edge.w);
      //     if (matches?.includes(edgeNode.meta?.resource ?? "")) {
      //       graph.setEdge(edge.v, edge.w, { ...edgeOptions });
      //       graph.removeEdge(edge.v, edge.w);
      //     }
      //   });
      // }
    },
  };
};
