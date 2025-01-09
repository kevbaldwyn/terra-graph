# Terra Graph

Auto-generated arhitecture diagrams from your terraform code.

## Requirements

`terra-graph` manipulates the output from the `terraform graph` command and turns it into something useable and sensible which can then be rendered to an image. To do this the following things are required:

- `terraform` - duh!
- `graphviz` - the output from `terraform graph` is in the `dot` format which is readable by graphviz and used by graphviz to generate a graphical representation of the graph. [Graphviz can be found here](https://graphviz.org/download/)

## Installation

Install via npm:

```bash
// globally
npm install -g terra-graph

// or add to your project
npm install terra-graph
```

Or globally via yarn:

```bash
// globally
yarn global add terra-graph

// or add to your project
yarn add terra-graph
```

## Basic Use

### Step 1

Generate the initial graph using terraform graph:

```bash
cd /my/terraform
terraform init
terraform graph > graph.txt
```

### Step 2

Use the `terra-graph` `create` command to parse the graph, apply some default formatting / filtering and output a (hopefully) beautiful diagram:

```bash
cat graph.txt | terra-graph create
```

This will use the default settings to generate an image called `terra-graph.png` in the location you ran the command.

### Help

```bash
terra-graph [command] --help
```

## Detailed Documentation

- [Diagram Configuration](./docs/configuration.md) - how to filter nodes, change the appearance, create a description box etc.
- [Hooks](./docs/hooks.md) - how to modify the diagram and filter elements using hooks, when and where to use them.
  - [Matchers](./docs/matchers.md) - built-in node matchers, how to write custom matchers. Matchers are used to identify elements in the graph to either filter or modify.
- [All terra-graph Commands](./docs/commands.md) - a list of all `terra-graph` commands
