# Commands
  <!-- commands -->
* [`terra-graph create`](#terra-graph-create)
* [`terra-graph terraform:graph`](#terra-graph-terraformgraph)

## `terra-graph create`

Create a diagram from the piped output of `terraform graph`

```
USAGE
  $ terra-graph create [-c <value>] [-o <value>] [-f <value>] [--verbose] [--continueOnError]

FLAGS
  -c, --configFile=<value>  [default: terra-graph.js] Provide custom configuration as a javascript file
  -f, --outFormat=<value>   [default: png] Choose the format of the generated diagram, defaults to `png` (see graphviz
                            available formats)
  -o, --outFile=<value>     Provide a custom name for the generated diagram, defaults to terra-graph.png
      --continueOnError     Continue to process graph and attenmpt to generate a diagram even if an error is encountered
      --verbose             Print detailed outoput of each hook and filter applied to the graph

DESCRIPTION
  Create a diagram from the piped output of `terraform graph`

EXAMPLES
  $ terra-graph create

  $ terra-graph create -o my-file.txt -f txt # generate raw dot format text file

  $ terra-graph create -c path/to/config.js # provide a custom configuration file with your own rules for manipualting the graph
```

_See code: [src/commands/create.ts](https://github.com/kevbaldwyn/terra-graph/blob/v1.2.0/src/commands/create.ts)_

## `terra-graph terraform:graph`

Initialises terraform specifically for terra-graph and then runs `terraform graph`. This requires no credentials and will not affect any existing backend or state. Typically this should be executed before running `terra-graph create`

```
USAGE
  $ terra-graph terraform:graph [-f <value>] [-s]

FLAGS
  -f, --backendFile=<value>  [default: terraform.tf] Provide the name of the file that contains your `backend {}`
                             configuration (expected .tf extension). An "_override.tf" version will be created, allowing
                             a brand new terra-graph only state file to be generated.
  -s, --skipCleanup          By default terra-graph will delete the terra-graph.tfstate file after generating the
                             initial terraform graph. This flag will skip this behaviour.

DESCRIPTION
  Initialises terraform specifically for terra-graph and then runs `terraform graph`. This requires no credentials and
  will not affect any existing backend or state. Typically this should be executed before running `terra-graph create`

EXAMPLES
  $ terra-graph terraform:graph --backendFile=backend.tf

  $ terra-graph terraform:graph --skipCleanup
```

_See code: [src/commands/terraform/graph.ts](https://github.com/kevbaldwyn/terra-graph/blob/v1.2.0/src/commands/terraform/graph.ts)_
<!-- commandsstop -->
