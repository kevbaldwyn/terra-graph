import { NodeModifier } from "../../../Nodes/Modifier.js";
import { Node, NodeWithMeta } from "../../../Nodes/Node.js";
import { Hook } from "../../Hooks/Hooks.js";
import { edgeReverse } from "../../Hooks/Modifiers/edgeReverse.js";
import { nodeToEdgeLabel } from "../../Hooks/Modifiers/nodeToEdgeLabel.js";
import { removeNodeAndRedirectRelationships } from "../../Hooks/Modifiers/removeNodeAndRedirectRelationships.js";
import { Plugin } from "../../Plugin.js";

export const S3: Plugin = () => ({
  [Hook.META_APPLY]: [
    removeNodeAndRedirectRelationships((nodeName, node) => {
      return (
        node.meta!.resource.startsWith("aws_s3_") &&
        !["aws_s3_bucket", "aws_s3_bucket_notification"].includes(
          node.meta!.resource
        )
      );
    }),
    edgeReverse(new Map([["aws_s3_bucket", ["aws_s3_bucket_notification"]]])),
  ],
  [Hook.GRAPH_FILTER]: [
    {
      match: (nodeName, node) => {
        return ["aws_s3_bucket_object"].includes(node.meta?.resource ?? "");
      },
      remove: true,
    },
  ],
  [Hook.GRAPH_DECORATE]: [nodeToEdgeLabel(["aws_s3_bucket_notification"])],
});
