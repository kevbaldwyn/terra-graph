# Commands
  <!-- commands -->
- [Commands](#commands)
  - [`terra-graph create`](#terra-graph-create)

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

_See code: [src/commands/create.ts](https://github.com/kevbaldwyn/terra-graph/blob/v1.0.2/src/commands/create.ts)_
<!-- commandsstop -->
