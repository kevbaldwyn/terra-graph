import { excludeResourceExceptWhenInEdgeMatches } from "../Graph/Hooks/Filters/excludeExceptWhenInEdgeMatches.js";
import { Hook } from "../Graph/Hooks/Hooks.js";
import { alignNodes } from "../Graph/Hooks/Modifiers/alignNodes.js";
import { groupResources } from "../Graph/Hooks/Modifiers/aws/groupResources.js";
import { singleResources } from "../Graph/Hooks/Modifiers/aws/singleResources.js";
import { edgeReverse } from "../Graph/Hooks/Modifiers/edgeReverse.js";
import { nodeToEdgeLabel } from "../Graph/Hooks/Modifiers/nodeToEdgeLabel.js";
import { removeEdge } from "../Graph/Hooks/Modifiers/removeEdge.js";
import { styleEdge } from "../Graph/Hooks/Modifiers/styleEdge.js";
import { Matcher } from "../Nodes/Matcher.js";
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
        match: Matcher.node.labelStartsWith([
          "aws_kms_key.",
          "aws_kms_alias.",
          "aws_ssm_parameter.",
        ]),
        remove: true,
      },
    ],
    [Hook.META_APPLY]: [
      edgeReverse([
        {
          from: Matcher.node.resourceOrNodeNameEquals(["aws_sqs_queue"]),
          to: Matcher.node.resourceOrNodeNameEquals([
            "aws_lambda_event_source_mapping",
            "aws_osis_pipeline",
          ]),
        },
        {
          from: Matcher.node.resourceOrNodeNameEquals([
            "aws_cloudwatch_event_rule",
          ]),
          to: Matcher.node.resourceOrNodeNameEquals([
            "aws_cloudwatch_event_target",
          ]),
        },
        {
          from: Matcher.node.resourceOrNodeNameEquals([
            "aws_cloudwatch_event_bus",
          ]),
          to: Matcher.node.resourceOrNodeNameEquals([
            "aws_cloudwatch_event_rule",
            "aws_cloudwatch_event_archive",
          ]),
        },
      ]),
      edgeReverse(
        [
          {
            from: Matcher.node.resourceOrNodeNameEquals(["aws_dynamodb_table"]),
            to: Matcher.node.resourceOrNodeNameEquals(["aws_lambda_function"]),
          },
        ],
        {
          dir: "both",
          style: "dotted",
          color: "#271aa0",
        }
      ),
      removeEdge<NodeWithMeta>([
        {
          from: Matcher.node.resourceEquals(["aws_scheduler_schedule"]),
          to: Matcher.node.resourceEquals(["aws_sqs_queue"]),
        },
      ]),
    ],
    [Hook.GRAPH_FILTER]: [
      excludeResourceExceptWhenInEdgeMatches([
        {
          node: Matcher.node.resourceEquals(["aws_cloudwatch_log_group"]),
          in: Matcher.node.resourceEquals(["aws_cloudwatch_event_target"]),
        },
      ]),
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
      alignNodes([
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
      nodeToEdgeLabel(
        Matcher.node.resourceEquals([
          "aws_lambda_event_source_mapping",
          "aws_cloudwatch_event_target",
          "aws_cloudwatch_log_destination",
        ])
      ),
      singleResources(),
      groupResources([
        { resources: ["aws_sfn_state_machine"], borderColour: "#9f003d" },
      ]),
      styleEdge(
        [
          {
            from: Matcher.node.resourceEquals(["aws_lambda_function"]),
            to: Matcher.node.resourceEquals(["aws_s3_bucket"]),
          },
        ],
        {
          dir: "both",
          style: "dotted",
          color: "#1a580e",
        }
      ),
    ],
  },
};

export default config;
