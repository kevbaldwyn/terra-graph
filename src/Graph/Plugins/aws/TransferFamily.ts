import { NodeWithMeta } from "../../../Nodes/Node.js";
import { Graph } from "../../Graph.js";
import { Hook } from "../../Hooks/Hooks.js";
import { Plugin } from "../../Plugin.js";

const createDefaultEventBus = (graph: Graph): Graph => {
  if (!graph.hasNode("aws_cloudwatch_event_bus.default")) {
    graph.setNode("aws_cloudwatch_event_bus.default", {
      meta: {
        resource: "aws_cloudwatch_event_bus",
        name: "default",
      },
      fontname: "sans-serif",
    });
  }
  return graph;
};

export const TransferFamily: Plugin = () => ({
  [Hook.META_BEFORE]: [
    {
      match: (nodeName, node) => {
        return nodeName.startsWith("aws_transfer_tag.");
      },
      remove: true,
    },
  ],
  [Hook.META_APPLY]: [
    {
      match: (nodeName, node: NodeWithMeta, graph) => {
        return node.meta?.resource === "aws_transfer_connector";
      },
      modify: (nodeName, node, graph) => {
        // create the default event bus and connect it this connector
        createDefaultEventBus(graph).setEdge(
          nodeName,
          "aws_cloudwatch_event_bus.default"
        );
      },
    },
    {
      match: (nodeName, node: NodeWithMeta, graph) => {
        return node.meta?.resource === "aws_cloudwatch_event_rule";
      },
      modify: (nodeName, node, graph) => {
        const edges = graph.outEdges(nodeName) ?? [];
        // if there are no out edges then this rule is not connected to an event bus (therefore most likely connect to the default event bus)
        if (edges.length == 0) {
          createDefaultEventBus(graph).setEdge(
            "aws_cloudwatch_event_bus.default",
            nodeName
          );
        } else {
          // if it has out edges, check if any are a aws_transfer_connector and change it to the default event bus
          edges.forEach((e) => {
            const edgeNode = graph.node(e.w);
            if (edgeNode.meta.resource === "aws_transfer_connector") {
              graph.removeEdge(e);
              graph.setEdge("aws_cloudwatch_event_bus.default", e.v);
            }
          });
        }
      },
    },
  ],
});
