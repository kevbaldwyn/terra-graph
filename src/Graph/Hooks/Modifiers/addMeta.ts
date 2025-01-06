import { NodeModifier } from '../../../Nodes/Modifier.js';
import { Node } from '../../../Nodes/Node.js';

export const addMeta = (): NodeModifier<Node> => ({
  match: (nodeName, node) => {
    return true;
  },
  modify: (nodename, node) => {
    const name = node.label.split('.') as string[];
    node.meta = {
      resource: name[0],
      name: name[1],
    };
  },
});
