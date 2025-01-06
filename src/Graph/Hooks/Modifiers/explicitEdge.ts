import { NodeMatcher } from '../../../Nodes/Matcher.js';
import { NodeModifier } from '../../../Nodes/Modifier.js';
import { Node } from '../../../Nodes/Node.js';

export const explicitEdge = <NodeType extends Node>(
  matchers: {
    match: NodeMatcher<NodeType>;
    in?: string[];
    out?: string[];
  }[],
): NodeModifier<NodeType> => ({
  describe: () => explicitEdge.name,
  match: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.match(nodeName, node, graph)) {
        return true;
      }
    }
    return false;
  },
  modify: (nodeName, node, graph) => {
    for (const matcher of matchers) {
      if (matcher.match(nodeName, node, graph)) {
        for (const n of matcher?.in ?? []) {
          graph.setEdge(n, nodeName);
        }
        for (const n of matcher?.out ?? []) {
          graph.setEdge(nodeName, n);
        }
      }
    }
  },
});
