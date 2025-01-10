import { Matcher } from '../../../../Nodes/Matcher.js';
import { NodeModifier } from '../../../../Nodes/Modifier.js';
import { NodeWithParent, htmlLabel } from '../../../../Nodes/Node.js';

type ResourceMap = { resources: string[]; borderColour?: string };

const flattenResources = (resources: ResourceMap[]): string[] => {
  return resources.flatMap((item) => item.resources);
};

const findInResources = (
  items: ResourceMap[],
  resourceToFind: string,
): ResourceMap | undefined => {
  return items.find((item) => item.resources.includes(resourceToFind));
};

export const groupResources = (
  groupableResources: ResourceMap[],
  defaultBorderColour = '#666666',
): NodeModifier<NodeWithParent> => ({
  describe: () => `aws.${groupResources.name}`,
  match: Matcher.node.resourceEquals(flattenResources(groupableResources)),
  modify: (nodeName, node, graph) => {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    if (flattenResources(groupableResources).includes(node.meta!.resource)) {
      // get all nodes and put in a subgraph
      const _successors = graph.successors(nodeName) ?? [];

      // only apply successor if the successor is ONLY a successor of the matched node
      // ie only group if the children are only children of the matched node
      const successors = _successors.filter((s) => {
        return (graph.inEdges(s) ?? []).length === 1;
      });

      if (successors && successors.length > 0) {
        // get in edges to reapply later
        const inEdges = graph.inEdges(nodeName);

        // set compound so edge joins to cluster
        graph.setGraph({
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          ...(graph.graph() as unknown as Record<string, any>),
          compound: true,
        });

        // recreate node with cluster prefix
        graph.removeNode(nodeName);
        graph.setNode(`cluster_${nodeName}`, {
          fontname: node.fontname,
          meta: { ...node.meta },
          parent: { ...node.parent },
          peripheries: 1,
          color:
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            findInResources(groupableResources, node.meta!.resource)
              ?.borderColour ?? defaultBorderColour,

          // style: "dashed",
          label: htmlLabel(
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            node.meta!.resource,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            node.meta!.name,
            `${graph.getRootDir()}/resources/imgs/aws/group/${
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              node.meta!.resource
            }_40x40.png`,
          ),
        });

        // set the nodes as children of the cluster
        for (const successor of successors) {
          graph.setParent(successor, `cluster_${nodeName}`);
        }

        // reapply edges
        if (inEdges) {
          for (const edge of inEdges) {
            graph.setEdge(edge.v, successors[0], {
              lhead: `cluster_${nodeName}`,
            });

            // TODO if possible:
            // "same" doesn't seem to work?
            // is "min" a fluke for the specifically tested graph? (but it creates an additional node)
            // graph.addRank({
            //   rankmode: "min",
            //   nodes: [edge.v, `cluster_${nodeName}`],
            // });
          }
        }
      }
    }
  },
});
