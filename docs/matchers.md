# Matchers

Matchers are used by both `NodeFilter` and `NodeModifier` hook types. They identify nodes in the graph that you wish to either filter out or modify in some way.

A basic matcher is a function that looks like this:

```javascript
const myMatcher = (nodeName, node, graph) => {
  return nodeName === 'aws_s3_bucket.my_bucket';
}
```

It accepts 3 args:

- `nodeName` the node name in the graph - this is the full terraform resource name
- `node` a `Node` object that contains additional properties describing the node. This is in fact a `Graphviz` node as per the [Graphviz docs](https://graphviz.org/docs/nodes/)
- `graph` this is the full current state of the graph. It is a [`Graph`](../src/Graph/Graph.ts) object which is an extension of the `graphlib-dot` package `Graph` object.

The full type definition of the `NodeMatcher` is this:

```typescript
type NodeMatchFn<ReturnType, NodeType extends Node> = (
  nodeName: string,
  node: NodeType,
  graph: Graph,
) => ReturnType;

type NodeMatcher<NodeType extends Node> = NodeMatchFn<boolean, NodeType>;
```

## Built in matchers with `Matcher`

Rather than writing your own matchers `terra-graph` has some useful built in matchers to handle common use-cases.

The `Matcher` class will return a matcher for each of the following specific scenarios which you can use in filters and modifiers:

```javascript
const myFilter = {
  match: Matcher.node.labelStartsWith(['aws_']),
  remove: true
}
const myModifier = {
  match: Matcher.node.labelStartsWith(['aws_s3_bucket.prefix_']),
  modify: (node, nodeName, graph) => {}
}
```

### `Matcher.node.labelStartsWith(startsWith: string[])`

Match nodes whose `label` property match any of the string elements in the array argument `startsWith`

### `Matcher.node.resourceEquals(values: string[])`

Match nodes whose `meta.resource` property match any of the string elements in the array argument `values`

### `Matcher.node.nodeNameEquals(values: string[])`

Match nodes whose full terraform resource name matche any of the string elements in the array argument `values`

### `Matcher.node.resourceOrNodeNameEquals(values: string[])`

Match nodes whose full terraform resource name or resource type match any of the string elements in the array argument `values`

### `Matcher.edge.fromTo(matchers: {from: NodeMatchFn; to: NodeMatchFn;}[])`

Match nodes whose from and to edges match nodes matching the given `NodeMatchFn`s.

```javascript
const myFilter = {
  // remove nodes that have an edge from aws_lambda_function to aws_s3_bucket
  match: Matcher.edge.fromTo([
    {
      from: Matcher.node.resourceEquals(['aws_lambda_function']),
      to: Matcher.node.resourceEquals(['aws_s3_bucket']),
    },
  ]),
  remove: true
}
```
