# Hooks

`terra-graph` works by taking the output of `terraform graph` which is in the `dot` language format and applying a set of filters and modifiers to the graph. The output of `terraform graph` can be very verbose and will include all `local`, `var`, and `data` resources (for every module you use as well) so we use hooks (and plugins) to manipulate the graph before it's pased to `graphviz` to render the result.

Hooks are predefined "lifecycle" events that allow different filters and modifiers to be applied at different times. The purpose of each hook is outlined below.

## Types of Hook

There are 2 types of hook, each with different purposes.

- NodeFilter - remove nodes (and it's edges) from the graph
- NodeModifier - modify nodes, edges or the graph in some way

Both hook types rely on the `NodeMatcher` which is documeted below.

### `NodeFilter`

A `NodeFilter` has the following type:

```typescript
type NodeFilter<NodeType extends Node> = {
  describe?: (nodeName: string, node: NodeType) => string;
  match: NodeMatcher<NodeType>;
  remove: boolean | NodeMatcher<NodeType>;
};
```

For example, this `NodeFilter` would remove a specific single terraform resource `aws_s3_bucket.my_bucket`:

```javascript
const myFilter = {
  match: (nodeName, node, graph) => {
    return nodeName === 'aws_s3_bucket.my_bucket';
  },
  remove: true
}
```

### `NodeModifier`

A `NodeModifier` has the following type:

```typescript
export type NodeModifier<NodeType extends Node> = {
  describe?: (nodeName: string, node: NodeType) => string;
  match: NodeMatcher<NodeType>;
  modify: (
    nodeName: string,
    node: NodeType,
    graph: Graph,
  ) => void;
};
```

For example to rename a specific resource:

```javascript
const myModifier = {
  match: (nodeName, node, graph) => {
    return nodeName === 'aws_s3_bucket.my_bucket';
  },
  modify: (nodeName, node, grapj) => {
    node.label = 'My Awesome Bucket';
  }
};
```

## Matchers

Each of these hook types depends on the concept of a `NodeMatcher`. More details about matchers can be found [here](matchers.md).

## Hook Lifecycle

The following lifecycle hooks are applied in this order:

### `meta.before`

**Hook Type:** `NodeFilter`

**Hook Enum:** `Hook.META_BEFORE`

First pass at removing unwanted nodes and edges. Meta data has not been applied to nodes yet so the number of prebuilt matchers that can be used is limited as the `node.meta` field will not exist. This hook is useful to reduce the size of the graph before further manipulation happens.

### `meta.apply`

**Hook Type:** `NodeModifier`

**Hook Enum:** `Hook.META_APPLY`

The primary purpose for this hook is to apply the meta (`node.meta`) data field that is then useful for matching in later hooks. If a parent can be determined that is also added at this step. Custom hooks added here can be used to provide additional fields that can be used in later hooks.

### `graph.filter`

**Hook Type:** `NodeFilter`

**Hook Enum:** `Hook.GRAPH_FILTER`

This is the primary filtering hook. `Node`s referecned in matchers here are of type `NodeWithMeta` or `NodeWithParent` and have additional fields that are useful for filtering:

```typescript
interface Node extends Record<string, unknown> {
  label: string;
}
interface NodeWithMeta extends Node {
  meta?: {
    resource: string;
    name: string;
  };
}
interface NodeWithParent extends NodeWithMeta {
  parent?: {
    node: NodeWithMeta;
    nodeName: string;
    label: string;
    isModule: boolean;
  };
}
```

For example removing all aws s3 buckets:

```javascript
const removeS3Buckets = {
  match: (nodeName, node, graph) => {
    return node.meta.resource === 'aws_s3_bucket';
  },
  remove: true
}
```

### `graph.decorate`

**Hook Type:** `NodeModifier`

**Hook Enum:** `Hook.GRAPH_DECORATE`

The primary hook for modifying nodes and the graph. As with `graph.filter` this hook has access to additional node properties that makes it easier to match and modify nodes and edges in the graph.

## Core Hooks

`terra-graph` applies a set of immutable built-in hooks by default. The behaviour of these hooks cannot be changed, they will always be the first hooks applied for each lifecycle stage. Their purpose is predominantly to apply meta data and filter noise from the initial graph.

You can see them [here](../src/config/hooks.core.ts).

## Hook Configuration

Hooks can be configured in in the `hooks` field of the config:

```javascript
const { Hook } = TerraGraph;

module.exports = {
  hooks: {
    [Hook.META_BEFORE]: [],
    [Hook.META_APPLY]: [],
    [Hook.GRAPH_FILTER]: [],
    [Hook.GRAPH_DECORATE]: [],
  }
};
```

### Overriding and extending the default hook configuration

If you do not create a config file `terra-graph` will use some default hook configuration as defined [here](../src/config/config.default.ts).

You can either choose to completely override this by creating your own configuration file OR you can use the `extend` function to extend from these hooks in your own configuration (reccomended):

```javascript
const { Hook, extend, defaultConfig } = TerraGraph;

module.exports {
  hooks: extend(defaultConfig.hooks, {
    [Hook.GRAPH_DECORATE]: [
      // my additional hooks
    ]
  },
};
```

## Pre-built hooks

There are a number of pre-built and configurable hooks [available](../src/Graph/Hooks/).
