import { Graph } from '../Graph/Graph.js';
import { NodeMatcher } from './Matcher.js';
import { Node } from './Node.js';

export type NodeModifyFn<NodeType extends Node> = (
  nodeName: string,
  node: NodeType,
  graph: Graph,
) => void;

export type NodeModifier<NodeType extends Node> = {
  describe?: (nodeName: string, node: NodeType) => string;
  match: NodeMatcher<NodeType>;
  modify: NodeModifyFn<NodeType>;
};
