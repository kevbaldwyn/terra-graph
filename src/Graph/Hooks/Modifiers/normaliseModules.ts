import { NodeModifier } from '../../../Nodes/Modifier.js';
import { NodeWithMeta } from '../../../Nodes/Node.js';

export const normaliseModules = (): NodeModifier<NodeWithMeta> => ({
  describe: () => normaliseModules.name,
  match: (nodeName, node) => {
    return nodeName.startsWith('cluster_module');
  },
  modify: (nodeName, node) => {
    node.peripheries = 0;
    node.label = '';
    // WARNING: this might mess things up?
    node.height = 0;
    node.width = 0;
  },
});
