import { Matcher } from '../../../Nodes/Matcher.js';
import { Hook } from '../../Hooks/Hooks.js';
import { edgeReverse } from '../../Hooks/Modifiers/edgeReverse.js';
import { Plugin } from '../../Plugin.js';

export const TrendMicroCloudFormationStack = (
  stackName: string,
  scanBucketNodeName: string,
): Plugin => {
  return () => ({
    [Hook.META_APPLY]: [
      edgeReverse([
        {
          from: Matcher.node.resourceOrNodeNameEquals([
            `aws_cloudformation_stack.${stackName}`,
          ]),
          to: Matcher.node.resourceEquals([
            'aws_s3_bucket_notification',
            'aws_sns_topic_subscription',
          ]),
        },
        {
          from: Matcher.node.resourceOrNodeNameEquals([scanBucketNodeName]),
          to: Matcher.node.resourceEquals(['aws_cloudformation_stack']),
        },
      ]),
    ],
  });
};
