import { Hook } from "../../Hooks/Hooks.js";
import { edgeReverse } from "../../Hooks/Modifiers/edgeReverse.js";
import { Plugin } from "../../Plugin.js";

export const TrendMicroCloudFormationStack = (
  stackName: string,
  scanBucketNodeName: string
): Plugin => {
  return () => ({
    [Hook.META_APPLY]: [
      edgeReverse(
        new Map([
          [
            `aws_cloudformation_stack.${stackName}`,
            ["aws_s3_bucket_notification", "aws_sns_topic_subscription"],
          ],
          [scanBucketNodeName, ["aws_cloudformation_stack"]],
        ])
      ),
    ],
  });
};
