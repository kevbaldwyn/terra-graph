import { Graph } from "../Graph/Graph.js";
import { Node } from "./Node.js";

export type NodeMatchFn<ReturnType, NodeType extends Node> = {
  (nodeName: string, node: NodeType, graph: Graph): ReturnType;
};

// if return true then it matches
export type NodeMatcher<NodeType extends Node> = NodeMatchFn<boolean, NodeType>;
