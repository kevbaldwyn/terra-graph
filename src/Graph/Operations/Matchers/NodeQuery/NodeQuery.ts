import z from 'zod';
import { NodeId, TgNodeAttributes } from '../../../TgGraph.js';
import { Operations } from '../../Operations.js';
import { NodeMatchFn } from '../NodeMatchFn.js';
import {
  AttrPredicate,
  ChildrenPredicate,
  NodeIdPredicate,
  QueryDsl,
  QuerySchema,
} from './QuerySchema.js';

export class NodeQuery {
  public static readonly schema = QuerySchema;

  public static from(input: z.infer<typeof QuerySchema>): NodeQuery {
    return new NodeQuery(NodeQuery.schema.parse(input));
  }

  public static fromJson(input: unknown): NodeQuery {
    return new NodeQuery(NodeQuery.schema.parse(input));
  }

  // public static safeParse(input: unknown) {
  //   return NodeQuery.schema.safeParse(input);
  // }

  constructor(private readonly dsl: QueryDsl) {}

  public toMatcher(): NodeMatchFn {
    return NodeQuery.compile(this.dsl);
  }

  public match(nodeId: NodeId, node: TgNodeAttributes, graph: Operations) {
    return this.toMatcher()(nodeId, node, graph);
  }

  public getDsl(): QueryDsl {
    return this.dsl;
  }

  private static compile(dsl: QueryDsl): NodeMatchFn {
    if ('any' in dsl) {
      return () => true;
    }

    if ('and' in dsl) {
      const compiled = dsl.and.map((item) => NodeQuery.compile(item));
      return (nodeId, node, graph) =>
        compiled.every((fn) => fn(nodeId, node, graph));
    }

    if ('or' in dsl) {
      const compiled = dsl.or.map((item) => NodeQuery.compile(item));
      return (nodeId, node, graph) =>
        compiled.some((fn) => fn(nodeId, node, graph));
    }

    if ('not' in dsl) {
      const compiled = NodeQuery.compile(dsl.not);
      return (nodeId, node, graph) => !compiled(nodeId, node, graph);
    }

    if ('attr' in dsl) {
      return NodeQuery.compileAttr(dsl.attr);
    }

    if ('nodeId' in dsl) {
      return NodeQuery.compileNodeId(dsl.nodeId);
    }

    if ('children' in dsl) {
      return NodeQuery.compileChildren(dsl.children);
    }

    if ('edge' in dsl) {
      const inMatcher = dsl.edge.in
        ? NodeQuery.compile(dsl.edge.in)
        : undefined;
      const outMatcher = dsl.edge.out
        ? NodeQuery.compile(dsl.edge.out)
        : undefined;

      return (nodeId, _node, graph) => {
        const inMatch = inMatcher
          ? graph.inEdges(nodeId).some((edgeId) => {
              const sourceId = graph.edgeSource(edgeId);
              const source = graph.getNodeAttributes(sourceId);
              return source ? inMatcher(sourceId, source, graph) : false;
            })
          : true;

        const outMatch = outMatcher
          ? graph.outEdges(nodeId).some((edgeId) => {
              const targetId = graph.edgeTarget(edgeId);
              const target = graph.getNodeAttributes(targetId);
              return target ? outMatcher(targetId, target, graph) : false;
            })
          : true;

        return inMatch && outMatch;
      };
    }

    return () => false;
  }

  private static compileAttr(attr: AttrPredicate): NodeMatchFn {
    return (_nodeId, node) => {
      const value = NodeQuery.getValueAtPath(
        node as Record<string, unknown>,
        attr.key,
      );
      return NodeQuery.matchPredicate(value, attr);
    };
  }

  private static compileNodeId(predicate: NodeIdPredicate): NodeMatchFn {
    return (nodeId) => NodeQuery.matchPredicate(String(nodeId), predicate);
  }

  private static compileChildren(predicate: ChildrenPredicate): NodeMatchFn {
    return (nodeId, _node, graph) => {
      const childCount = graph.successors(nodeId).length;

      if (predicate.exists !== undefined) {
        return predicate.exists ? childCount > 0 : childCount === 0;
      }

      if (predicate.count !== undefined) {
        return childCount === predicate.count;
      }

      return false;
    };
  }

  private static matchPredicate(
    value: unknown,
    predicate: Omit<AttrPredicate, 'key'> | NodeIdPredicate,
  ): boolean {
    if (predicate.eq !== undefined) {
      return value === predicate.eq;
    }
    if (predicate.in !== undefined) {
      return predicate.in.some((item) => item === value);
    }
    if (predicate.contains !== undefined) {
      return String(value ?? '').includes(predicate.contains);
    }
    if (predicate.startsWith !== undefined) {
      const text = String(value ?? '');
      const needles = Array.isArray(predicate.startsWith)
        ? predicate.startsWith
        : [predicate.startsWith];
      return needles.some((item) => text.startsWith(item));
    }
    if (predicate.endsWith !== undefined) {
      const text = String(value ?? '');
      const needles = Array.isArray(predicate.endsWith)
        ? predicate.endsWith
        : [predicate.endsWith];
      return needles.some((item) => text.endsWith(item));
    }
    if (predicate.exists !== undefined) {
      return predicate.exists ? value !== undefined : value === undefined;
    }
    return false;
  }

  private static getValueAtPath(
    target: Record<string, unknown>,
    path: string,
  ): unknown {
    if (!path) {
      return undefined;
    }
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object' && key in (acc as object)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, target);
  }
}
