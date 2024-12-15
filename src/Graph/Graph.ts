import { Graph as GraphLibGraph, GraphOptions } from "graphlib";
import dot from "graphlib-dot";
import { Node } from "../Nodes/Node.js";
import { NodeFilter } from "../Nodes/Filter.js";
import { NodeModifier } from "../Nodes/Modifier.js";
import { Command } from "@oclif/core";
import { NodeMatchError, NodeModifyError } from "../Nodes/NodeError.js";

type Rank = {
  rankmode: string;
  nodes: string[];
};

export class Graph extends GraphLibGraph {
  constructor(options?: GraphOptions, private ranks: Rank[] = []) {
    super(options);
  }

  public addRank(rank: Rank) {
    this.ranks.push(rank);
  }

  public filterNodes(filter: { (v: string): boolean }): Graph {
    return Graph.fromGraphLib(super.filterNodes(filter), this.ranks);
  }

  public toString(): string {
    const graphString = dot.write(this);
    if (this.ranks.length > 0) {
      const rankString = this.ranks
        .map((rank) => {
          return `  { rank = ${rank.rankmode}; ${rank.nodes
            .map((n) => `"${n}";`)
            .join(" ")} }`;
        })
        .join("\n");
      const pos = graphString.lastIndexOf("}");
      return this.postProcessString(
        `${graphString.substring(0, pos)}${rankString}\n}`
      );
    }

    return this.postProcessString(graphString);
  }

  private postProcessString(graphString: string): string {
    // post process this to remove quotes around html
    // match "<< and >>" and replace to just << and >>
    return graphString
      .replaceAll('"<<', "<<")
      .replaceAll('>>"', ">>")
      .replaceAll('\\"', '"');
  }

  static fromString(data: string): Graph {
    return Graph.fromGraphLib(dot.read(data));
  }

  static fromGraph(graph: Graph): Graph {
    const g = new Graph(
      {
        directed: graph.isDirected(),
        multigraph: graph.isMultigraph(),
        compound: graph.isCompound(),
      },
      graph.ranks
    );
    Graph.assignProps(g, graph);
    g.setGraph(graph.graph());

    return g;
  }

  static fromGraphLib(graph: GraphLibGraph, ranks?: Rank[]): Graph {
    const g = new Graph(
      {
        directed: graph.isDirected(),
        multigraph: graph.isMultigraph(),
        compound: graph.isCompound(),
      },
      ranks ?? []
    );
    g.setGraph(graph.graph());

    Graph.assignProps(g, graph);
    return g;
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
