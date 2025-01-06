import { existsSync } from 'node:fs';
import path from 'node:path';
import { NodeModifier } from '../../../../Nodes/Modifier.js';
import { NodeWithParent, htmlLabel } from '../../../../Nodes/Node.js';

export const singleResources = (): NodeModifier<NodeWithParent> => ({
  describe: () => `aws.${singleResources.name}`,
  match: (nodeName, node) => {
    return node.meta?.resource.startsWith('aws_') ?? false;
  },
  modify: (nodeName, node, graph) => {
    let img = `resources/imgs/aws/resource/${
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      node.meta!.resource
    }.png`;
    if (!existsSync(path.resolve(img))) {
      img = 'resources/imgs/aws/resource/aws_general.png';
    }
    node.image = img;
    node.labelloc = 'b';
    node.shape = 'plaintext';
    node.height = 1.6;
    node.width = 1.2;
    // node.fixedsize = "shape";
    node.fixedsize = true;
    node.imagescale = true;
    // node.fontsize = "24pt";
    node.imagepos = 'tc';

    if (node.parent) {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      node.label = htmlLabel(node.meta!.resource, node.parent?.node.meta!.name);
    } else {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      node.label = htmlLabel(node.meta!.resource, node.meta!.name);
    }
  },
});
