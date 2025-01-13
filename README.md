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

This probably won't be sufficient for most projects though. See "How to properly generate then initial graph" for more details.

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

## How to properly generate the initial graph using `terra-graph terraform:graph`

In most projects you will be using a state file of some kind to manage the changes in your infrastructure. What `terraform graph` actually does is generat a graph of what actions it needs to complete (and in what order). Unless you are running `terra-graph` on brand new infrastructure it won't generate an accurate diagram as it will be using the diff of what new changes are needed. You also will likely have custom backend configuration (that might require credentials etc) for your terraform state.

To overcome this `terra-graph` has a command that will generate an isolated brand new graph without touching or going anywhere near your state or backend config.

```bash
terra-graph terraform:graph
```

This will create an override file for the file that contains your `backend {}` config block and then run `terraform init` and `terraform graph`. By default it expects the `backend {}` block to live in `terraform.tf` but that can be configured:

```bash
# (it still expects the file to have a .tf extension)
terra-graph terraform:graph --backendFile=backend.tf
```

This command can then be sent to `terra-graph create` as normal:

```bash
terra-graph terraform:graph | terra-graph create
```

## Quick Start Use

```bash
# generate the graph from a brand new state
terra-graph terraform:graph > mygraph.txt
# send that graph to terra-graph
cat mygraph.txt | terra-graph create
```

Or more simply:

```bash
terra-graph terraform:graph | terra-graph create
```

## Detailed Documentation

- [Diagram Configuration](./docs/configuration.md) - how to filter nodes, change the appearance, create a description box etc.
- [Hooks](./docs/hooks.md) - how to modify the diagram and filter elements using hooks, when and where to use them.
  - [Matchers](./docs/matchers.md) - built-in node matchers, how to write custom matchers. Matchers are used to identify elements in the graph to either filter or modify.
- [All terra-graph Commands](./docs/commands.md) - a list of all `terra-graph` commands
