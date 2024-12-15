import { existsSync } from "fs";
import { NodeModifier } from "../../../../Nodes/Modifier.js";
import { htmlLabel, NodeWithParent } from "../../../../Nodes/Node.js";
import path from "path";

export const singleResources = (): NodeModifier<NodeWithParent> => ({
  describe: () => `aws.${singleResources.name}`,
  match: (nodeName, node) => {
    return node.meta?.resource.startsWith("aws_") ?? false;
  },
  modify: (nodeName, node, graph) => {
    let img = `resources/imgs/aws/resource/${node.meta!.resource}.png`;
    if (!existsSync(path.resolve(img))) {
      img = `resources/imgs/aws/resource/aws_general.png`;
    }
    node.image = img;
    node.labelloc = "b";
    node.shape = "plaintext";
    node.height = 1.6;
    node.width = 1.2;
    // node.fixedsize = "shape";
    node.fixedsize = true;
    node.imagescale = true;
    // node.fontsize = "24pt";
    node.imagepos = "tc";

    if (node.parent) {
      node.label = htmlLabel(node.meta!.resource, node.parent?.node.meta!.name);
    } else {
      node.label = htmlLabel(node.meta!.resource, node.meta!.name);
    }
  },
});
