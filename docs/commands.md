# Commands
  <!-- commands -->
* [`terra-graph create`](#terra-graph-create)

## `terra-graph create`

Create a diagram from the piped output of `terraform graph`

```
USAGE
  $ terra-graph create [-c <value>] [-o <value>] [-f <value>] [--verbose] [--continueOnError]

FLAGS
  -c, --configFile=<value>  [default: terra-graph.js]
  -f, --outFormat=<value>   [default: png]
  -o, --outFile=<value>
  --continueOnError
  --verbose

DESCRIPTION
  Create a diagram from the piped output of `terraform graph`

EXAMPLES
  $ terra-graph create
```

_See code: [src/commands/create.ts](https://github.com/kevbaldwyn/terra-graph/blob/v1.0.2/src/commands/create.ts)_
<!-- commandsstop -->
