import { GraphResolver, HookRunnerContext } from './GraphResolver.js';
import { mock } from 'jest-mock-extended';
import { Hook } from './Hooks/Hooks.js';
import { NodeId, TgNodeAttributes } from './TgGraph.js';
import { Adapter } from './Adapter.js';
import { Operations } from './Operations/Operations.js';

describe('', () => {
  it('should', () => {
    const adapter = mock<Adapter & Operations<TgNodeAttributes>>();
    adapter.nodeIds.mockReturnValue([]);
    // const adapter = new GraphologyAdapter(new Graph.DirectedGraph());

    const resolver = new GraphResolver({
      fromTgGraph() {
        return adapter;
      },
    });

    const res = resolver.resolve({
      graph: {
        edges: [],
        nodes: {},
        description: {},
      },
      context: mock<HookRunnerContext>(),
      hooks: {
        [Hook.META_BEFORE]: [
          // can be object or class
          // should be a class only I think to allow easier identification
          // for serialization
          // how to enforce that?
          {
            match: (nodeId: NodeId, node, graph) => {
              // node.label;
              return graph.inEdges(nodeId).length > 0;
            },
            apply: (_nodeId, _node, graph) => graph,
            serialize: () => ({ id: 'test-hook' }),
          },
        ],
      },
    });

    // res.toTgGraph();
  });
});
