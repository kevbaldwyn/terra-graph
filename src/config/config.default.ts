import { excludeResourceExceptWhenInEdgeMatches } from "../Graph/Hooks/Filters/excludeExceptWhenInEdgeMatches.js";
import { Hook } from "../Graph/Hooks/Hooks.js";
import { alignNodes } from "../Graph/Hooks/Modifiers/alignNodes.js";
import { groupResources } from "../Graph/Hooks/Modifiers/aws/groupResources.js";
import { singleResources } from "../Graph/Hooks/Modifiers/aws/singleResources.js";
import { edgeReverse } from "../Graph/Hooks/Modifiers/edgeReverse.js";
import { nodeToEdgeLabel } from "../Graph/Hooks/Modifiers/nodeToEdgeLabel.js";
import { removeEdge } from "../Graph/Hooks/Modifiers/removeEdge.js";
import { styleEdge } from "../Graph/Hooks/Modifiers/styleEdge.js";
import { NodeWithMeta } from "../Nodes/Node.js";
import { Config } from "./Config.js";

const config: Config = {
  graph: {
    rankdir: "LR",
    pad: 1,
    // splines: "polyline",
    // splines: "line",
    // concentrate: true,
  },
  hooks: {
    [Hook.META_BEFORE]: [
      {
        match: (nodeName, node) => {
          return (
            node.label.startsWith("aws_kms_key.") ||
            node.label.startsWith("aws_kms_alias.")
          );
        },
        remove: true,
      },
    ],
    [Hook.META_APPLY]: [
      edgeReverse(
        new Map([
          [
            "aws_sqs_queue",
            ["aws_lambda_event_source_mapping", "aws_osis_pipeline"],
          ],
          ["aws_cloudwatch_event_rule", ["aws_cloudwatch_event_target"]],
          [
            "aws_cloudwatch_event_bus",
            ["aws_cloudwatch_event_rule", "aws_cloudwatch_event_archive"],
          ],
        ])
      ),
      edgeReverse(new Map([["aws_dynamodb_table", ["aws_lambda_function"]]]), {
        dir: "both",
        style: "dotted",
        color: "#271aa0",
      }),
      removeEdge<NodeWithMeta>([
        {
          from: (nodeName, node) =>
            node.meta?.resource === "aws_scheduler_schedule",
          to: (nodeName, node) => node.meta?.resource === "aws_sqs_queue",
        },
      ]),
    ],
    [Hook.GRAPH_FILTER]: [
      excludeResourceExceptWhenInEdgeMatches(
        new Map([["aws_cloudwatch_log_group", ["aws_cloudwatch_event_target"]]])
      ),
      {
        match: (nodeName, node) => {
          return node.meta?.resource.startsWith("aws_iam") ?? false;
        },
        remove: true,
      },
      {
        match: (nodeName, node) => {
          return node.meta?.resource.startsWith("aws_lambda") ?? false;
        },
        remove: (nodeName, node) => {
          return ![
            "aws_lambda_function",
            "aws_lambda_event_source_mapping",
          ].includes(node.meta!.resource);
        },
      },
    ],
    [Hook.GRAPH_DECORATE]: [
      alignNodes<NodeWithMeta>([
        {
          from: (nodeName, node) => node.meta?.resource === "aws_sqs_queue",
          to: (nodeName, node) => node.meta?.resource === "aws_sqs_queue",
        },
        {
          from: (nodeName, node) =>
            node.meta?.resource === "aws_scheduler_schedule",
          to: () => true,
        },
      ]),
      nodeToEdgeLabel([
        "aws_lambda_event_source_mapping",
        "aws_cloudwatch_event_target",
      ]),
      singleResources(),
      groupResources([
        { resources: ["aws_sfn_state_machine"], borderColour: "#9f003d" },
      ]),
      styleEdge(new Map([["aws_lambda_function", ["aws_s3_bucket"]]]), {
        dir: "both",
        style: "dotted",
        color: "#1a580e",
      }),
    ],
  },
};

export default config;
