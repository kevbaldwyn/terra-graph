import { Graph } from '../Graph/Graph.js';
import { Node, NodeWithMeta } from './Node.js';

export type NodeMatchFn<ReturnType, NodeType extends Node> = (
  nodeName: string,
  node: NodeType,
  graph: Graph,
) => ReturnType;

// if return true then it matches
export type NodeMatcher<NodeType extends Node> = NodeMatchFn<boolean, NodeType>;

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Matcher {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  static node: Record<string, (...args: any[]) => NodeMatchFn<boolean, Node>> =
    {
      labelStartsWith: (startsWith: string[]): NodeMatchFn<boolean, Node> => {
        return (nodeName, node) => {
          for (const str of startsWith) {
            if (node.label.startsWith(str)) {
              return true;
            }
          }
          return false;
        };
      },
      resourceEquals: (values: string[]): NodeMatcher<NodeWithMeta> => {
        return (nodeName, node) => {
          return values.includes(node.meta?.resource ?? '');
        };
      },
      nodeNameEquals: (values: string[]): NodeMatcher<NodeWithMeta> => {
        return (nodeName) => {
          return values.includes(nodeName);
        };
      },
      resourceOrNodeNameEquals: (
        values: string[],
      ): NodeMatcher<NodeWithMeta> => {
        return (nodeName, node) => {
          return (
            values.includes(node.meta?.resource ?? '') ||
            values.includes(nodeName)
          );
        };
      },
    };

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  static edge: Record<string, (...args: any[]) => NodeMatchFn<boolean, Node>> =
    {
      fromTo: (
        matchers: {
          from: NodeMatchFn<boolean, Node>;
          to: NodeMatchFn<boolean, Node>;
        }[],
      ) => {
        return (nodeName, node, graph) => {
          for (const matcher of matchers) {
            if (matcher.from(nodeName, node, graph)) {
              return true;
            }
          }
          return false;
        };
      },
    };
}
