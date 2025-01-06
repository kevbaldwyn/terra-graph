import { NodeMatchFn, NodeMatcher } from './Matcher.js';
import { Node } from './Node.js';

export type NodeFilterRemove<NodeType extends Node> =
  | boolean
  | NodeMatchFn<boolean, NodeType>;

export type NodeFilter<NodeType extends Node> = {
  describe?: (nodeName: string, node: NodeType) => string;
  match: NodeMatcher<NodeType>;
  remove: NodeFilterRemove<NodeType>;
};
