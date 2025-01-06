import { Matcher } from '../../../Nodes/Matcher.js';
import { Hook } from '../../Hooks/Hooks.js';
import { edgeReverse } from '../../Hooks/Modifiers/edgeReverse.js';
import { nodeToEdgeLabel } from '../../Hooks/Modifiers/nodeToEdgeLabel.js';
import { removeNodeAndRedirectRelationships } from '../../Hooks/Modifiers/removeNodeAndRedirectRelationships.js';
import { Plugin } from '../../Plugin.js';

export const S3: Plugin = () => ({
  [Hook.META_APPLY]: [
    removeNodeAndRedirectRelationships((nodeName, node) => {
      return (
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        node.meta!.resource.startsWith('aws_s3_') &&
        !['aws_s3_bucket', 'aws_s3_bucket_notification'].includes(
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          node.meta!.resource,
        )
      );
    }),
    edgeReverse([
      {
        from: Matcher.node.resourceOrNodeNameEquals(['aws_s3_bucket']),
        to: Matcher.node.resourceOrNodeNameEquals([
          'aws_s3_bucket_notification',
        ]),
      },
    ]),
  ],
  [Hook.GRAPH_FILTER]: [
    {
      match: Matcher.node.resourceEquals(['aws_s3_bucket_object']),
      remove: true,
    },
  ],
  [Hook.GRAPH_DECORATE]: [
    nodeToEdgeLabel(
      Matcher.node.resourceEquals(['aws_s3_bucket_notification']),
    ),
  ],
});
