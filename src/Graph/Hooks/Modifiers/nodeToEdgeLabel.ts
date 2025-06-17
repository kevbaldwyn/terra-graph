import { NodeMatcher } from '../../../Nodes/Matcher.js';
import { NodeModifier } from '../../../Nodes/Modifier.js';
import {
  NodeWithMeta,
  htmlLabel,
  leafName,
  rootName,
} from '../../../Nodes/Node.js';

// TODO: pass in style options
export const nodeToEdgeLabel = <NodeType extends NodeWithMeta>(
  match: NodeMatcher<NodeType>,
): NodeModifier<NodeType> => ({
  describe: () => nodeToEdgeLabel.name,
  match,
  modify: (nodeName, node, graph) => {
    const edges = graph.nodeEdges(nodeName);

    if (edges && edges.length === 2) {
      for (const edge of edges) {
        graph.removeEdge(edge);
      }

      const labelNode = graph.node(edges[0].w);
      graph.setEdge(edges[0].v, edges[1].w, {
        label: htmlLabel(rootName(labelNode), leafName(labelNode)),
        fontname: 'sans-serif',
        fontsize: '10pt',
      });
      graph.removeNode(nodeName);
    }
  },
});
