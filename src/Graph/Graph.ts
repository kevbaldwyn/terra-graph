import { Graph as GraphLibGraph, GraphOptions } from "graphlib";
import dot from "graphlib-dot";
import { EdgeOptions, Node } from "../Nodes/Node.js";
import { NodeFilter } from "../Nodes/Filter.js";
import { NodeModifier } from "../Nodes/Modifier.js";
import { Command } from "@oclif/core";
import { NodeMatchError, NodeModifyError } from "../Nodes/NodeError.js";

type Rank = {
  rankmode: string;
  nodes: string[];
};

type Key = EdgeOptions;

export class Graph extends GraphLibGraph {
  constructor(
    options?: GraphOptions,
    private ranks: Rank[] = [],
    private key: Key[] = [],
    private description: Record<string, string> = {}
  ) {
    super(options);
  }

  static fromString(
    data: string,
    ranks?: Rank[],
    key?: Key[],
    description?: Record<string, string>
  ): Graph {
    return Graph.fromGraphLib(dot.read(data), ranks, key, description);
  }

  static fromGraph(graph: Graph): Graph {
    const g = new Graph(
      {
        directed: graph.isDirected(),
        multigraph: graph.isMultigraph(),
        compound: graph.isCompound(),
      },
      graph.ranks,
      graph.key,
      graph.description
    );
    Graph.assignProps(g, graph);
    g.setGraph(graph.graph());

    return g;
  }

  static fromGraphLib(
    graph: GraphLibGraph,
    ranks?: Rank[],
    key?: Key[],
    description?: Record<string, string>
  ): Graph {
    const g = new Graph(
      {
        directed: graph.isDirected(),
        multigraph: graph.isMultigraph(),
        compound: graph.isCompound(),
      },
      ranks ?? [],
      key ?? [],
      description ?? {}
    );
    g.setGraph(graph.graph());

    Graph.assignProps(g, graph);
    return g;
  }

  public addRank(rank: Rank) {
    this.ranks.push(rank);
  }

  public addKey(key: Key) {
    if (key.key && !this.key.find((k) => k.key === key.key)) {
      this.key.push(key);
    }
  }

  public filterNodes(filter: { (v: string): boolean }): Graph {
    return Graph.fromGraphLib(
      super.filterNodes(filter),
      this.ranks,
      this.key,
      this.description
    );
  }

  public toString(): string {
    const graphString = dot.write(this);
    const firstQuote = graphString.indexOf('"');
    const graphStart = graphString.substring(0, firstQuote);
    const newGraphString = graphString.replace(
      graphStart,
      `${graphStart}
      ${this.createKey()}
      `
    );
    const lastBrace = newGraphString.lastIndexOf("}");

    const append = [this.createRanks(), "}"];

    return this.postProcessString(
      `${newGraphString.substring(0, lastBrace)}
      ${append.join("\n")}`
    );
  }

  private postProcessString(graphString: string): string {
    // post process this to remove quotes around html
    // match "<< and >>" and replace to just << and >>
    return graphString
      .replaceAll('"<<', "<<")
      .replaceAll('>>"', ">>")
      .replaceAll('\\"', '"');
  }

  private createKey() {
    if (this.key.length > 0 || this.description) {
      const clusterName = "Key";

      return `
    subgraph "cluster_${clusterName}" {
      label = "${clusterName}"
      color = "#DDDDDD"
      fontname = "sans-serif"
      penwidth = 0.75
      fontcolor = "#999999"
      fontsize = 10
      ${
        this.description
          ? `"${clusterName}_description" [shape="plaintext" fontname="sans-serif" label="<<table align="left" border="0" cellpadding="2" cellspacing="0" cellborder="0">
                ${Object.keys(this.description)
                  .map((k) => {
                    return `<tr>
                    <td align="left"><font point-size="10" color="#999999">${k}:</font></td>
                    <td align="left"><font point-size="10" color="#000000">&nbsp;&nbsp;&nbsp;${
                      this.description![k]
                    }</font></td>
                  </tr>`;
                  })
                  .join("")}
              </table>>"];`
          : ""
      }
      ${this.key
        .map((k, i) => {
          return `
        "${clusterName}.A${i}" [label="" style="invis" height=0 width=0];
        "${clusterName}.B${i}" [label="" style="invis" height=0 width=0];
        "${clusterName}.A${i}" -> "${clusterName}.B${i}" [label="${
            k.key
          }" fontname="sans-serif" fontsize="10" ${Object.keys(k)
            .map((kk) => `${kk}="${k[kk]}"`)
            .join(" ")}];
        ${
          this.description
            ? `"${clusterName}_description" -> "${clusterName}.A${i}" [style="invis"]`
            : ""
        }`;
        })
        .join("\n")}
    }
    subgraph cluster_padKey {
      style = "invis"
      "S1" [style="invis"];
      "S2" [style="invis"];
      "S3" [style="invis"];
      "S4" [style="invis"];
      "S1" -> "S2" [style="invis"];
      "S2" -> "S3" [style="invis"];
      "S3" -> "S4" [style="invis"];
    }
    `;
    }
    return "";
  }

  private createRanks() {
    if (this.ranks.length > 0) {
      return this.ranks
        .map((rank) => {
          return `  { rank = ${rank.rankmode}; ${rank.nodes
            .map((n) => `"${n}";`)
            .join(" ")} }`;
        })
        .join("\n");
    }
    return "";
  }

  static assignProps(to: Graph, from: GraphLibGraph) {
    from.nodes().forEach((entry) => {
      const node = from.node(entry);
      const parent = from.parent(entry);
      to.setNode(entry, node);
      if (parent) {
        to.setParent(entry, parent);
      }
    });

    from.edges().forEach((entry) => {
      const edge = from.edge(entry);
      to.setEdge({ v: entry.v, w: entry.w, name: entry.name }, edge);
    });
  }
}

const logMessage = (prefix: string, msg: string, nodeName: string) => {
  return ` -> [${prefix}][${msg}]: ${nodeName}`;
};

// TODO: move these 2 functions
export const filter = <NodeType extends Node>(
  graph: Graph,
  filters: NodeFilter<NodeType>[],
  logger: Command["log"],
  error: Command["error"]
): Graph => {
  return graph.filterNodes((nodeName) => {
    const nodeObj = graph.node(nodeName);
    for (const filter of filters) {
      try {
        if (filter.match(nodeName, nodeObj, graph)) {
          if (typeof filter.remove === "boolean") {
            if (filter.remove) {
              if (filter.describe) {
                logger(
                  logMessage(
                    "filter:remove",
                    filter.describe(nodeName, nodeObj),
                    nodeName
                  )
                );
              }
              return false;
            }
          } else {
            if (filter.remove(nodeName, nodeObj, graph)) {
              if (filter.describe) {
                logger(
                  logMessage(
                    "filter:remove",
                    filter.describe(nodeName, nodeObj),
                    nodeName
                  )
                );
              }
              return false;
            }
          }
        }
      } catch (e) {
        error(new NodeMatchError({ cause: e }, { nodeName, node: nodeObj }));
      }
    }
    return true;
  });
};

export const decorate = <NodeType extends Node>(
  graph: Graph,
  modifiers: NodeModifier<NodeType>[],
  logger: Command["log"],
  error: Command["error"]
) => {
  // copy the graph so we can immutability change it
  let _graph = Graph.fromGraph(graph);

  // for each modifier
  modifiers.forEach((modifier) => {
    // iterate the nodes of the copy
    _graph.nodes().forEach((nodeName) => {
      const nodeObj = _graph.node(nodeName);
      try {
        if (modifier.match(nodeName, nodeObj, _graph)) {
          if (modifier.describe) {
            logger(
              logMessage(
                "decorate:match",
                modifier.describe(nodeName, nodeObj),
                nodeName
              )
            );
          }
          try {
            modifier.modify(nodeName, nodeObj, _graph);
          } catch (e) {
            throw new NodeModifyError(
              { cause: e },
              { nodeName, node: nodeObj }
            );
          }
        }
      } catch (e) {
        if (!(e instanceof NodeModifyError)) {
          e = new NodeMatchError({ cause: e }, { nodeName, node: nodeObj });
        }
        error(e as Error);
      }
    });

    _graph = Graph.fromGraph(_graph);
  });
  return _graph;
};
