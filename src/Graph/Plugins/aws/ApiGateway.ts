import { Matcher } from "../../../Nodes/Matcher.js";
import { leafName, NodeWithMeta } from "../../../Nodes/Node.js";
import { Hook } from "../../Hooks/Hooks.js";
import { edgeReverse } from "../../Hooks/Modifiers/edgeReverse.js";
import { nodeToEdgeLabel } from "../../Hooks/Modifiers/nodeToEdgeLabel.js";
import { Plugin } from "../../Plugin.js";

export const ApiGateway: Plugin = () => ({
  [Hook.META_BEFORE]: [
    {
      match: Matcher.node.labelStartsWith([
        "aws_api_gateway_integration_response.",
        "aws_api_gateway_method_response.",
        "aws_api_gateway_method_settings.",
        "aws_api_gateway_account.",
        "aws_api_gateway_model.",
        "aws_wafv2_web_acl_logging_configuration.",
      ]),
      remove: true,
    },
  ],
  [Hook.META_APPLY]: [
    // compress nodes between
    {
      match: Matcher.node.resourceEquals(["aws_api_gateway_rest_api"]),
      modify: (nodeName, node, graph) => {
        // compress into one node
        // maintain edges of end nodes
        const recurse = (nodeName: string, toRemove: string[]) => {
          const prev = graph.predecessors(nodeName) ?? [];
          if (prev.length === 1) {
            const prevNode = graph.node(prev[0]);
            if (prevNode.meta.resource === "aws_api_gateway_resource") {
              toRemove.push(prev[0]);
              // recurse
              recurse(prev[0], toRemove);
            }
          }
          return toRemove;
        };

        // get the nodes recursivley up the tree
        const toRemove = recurse(nodeName, []);

        // generate a name describing the path
        const originalNode = graph.node(toRemove[0]);
        const newNodeLabel = toRemove.map((n) => leafName(n)).join("/");
        const newNodeName = `aws_api_gateway_resource.${newNodeLabel}`;

        // create new node
        graph.setNode(newNodeName, {
          ...originalNode,
          meta: {
            ...originalNode.meta,
            name: newNodeLabel,
          },
        });

        // recreate the original edges but into this new node
        const outEdges = graph.outEdges(toRemove[0]) ?? [];
        const inEdges = graph.inEdges(toRemove[toRemove.length - 1]) ?? [];
        outEdges.forEach((e) => {
          graph.setEdge(newNodeName, e.w);
        });
        inEdges.forEach((e) => {
          graph.setEdge(e.v, newNodeName);
        });

        // remove original nodes in path
        toRemove.forEach((n) => {
          graph.removeNode(n);
        });
      },
    },
  ],
  [Hook.GRAPH_DECORATE]: [
    edgeReverse([
      {
        from: Matcher.node.resourceOrNodeNameEquals([
          "aws_api_gateway_rest_api",
        ]),
        to: Matcher.node.resourceOrNodeNameEquals(["aws_api_gateway_resource"]),
      },
      {
        from: Matcher.node.resourceOrNodeNameEquals(["aws_api_gateway_method"]),
        to: Matcher.node.resourceOrNodeNameEquals([
          "aws_api_gateway_integration",
        ]),
      },
      {
        from: Matcher.node.resourceOrNodeNameEquals([
          "aws_api_gateway_resource",
        ]),
        to: Matcher.node.resourceOrNodeNameEquals(["aws_api_gateway_method"]),
      },
      {
        from: Matcher.node.resourceOrNodeNameEquals(["aws_wafv2_web_acl"]),
        to: Matcher.node.resourceOrNodeNameEquals([
          "aws_wafv2_web_acl_association",
        ]),
      },
      {
        from: Matcher.node.resourceOrNodeNameEquals(["aws_wafv2_ip_set"]),
        to: Matcher.node.resourceOrNodeNameEquals(["aws_wafv2_web_acl"]),
      },
    ]),
    nodeToEdgeLabel(
      Matcher.node.resourceEquals([
        "aws_api_gateway_deployment",
        "aws_api_gateway_method",
        "aws_wafv2_web_acl_association",
      ])
    ),
  ],
});
