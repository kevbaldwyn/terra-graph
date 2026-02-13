import { mock } from 'jest-mock-extended';
import { GraphResolver, PhaseRunnerContext } from './GraphResolver.js';
import { BaseRule } from './Rules/Rule.js';
import { AdapterOperations } from './Operations/Operations.js';

describe('GraphResolver.resolve', () => {
  it('shoud resolve without phases when there are no nodes', () => {
    const adapter = mock<AdapterOperations>();
    adapter.nodeIds.mockReturnValue([]);
    // const adapter = new GraphologyAdapter(new Graph.DirectedGraph());

    const resolver = new GraphResolver({
      fromTgGraph() {
        return adapter;
      },
    });

    // const rule = mock<NodeRule>();
    // rule.apply.mockImplementation((_nodeId, _node, graph) => graph);
    // rule.match.mockImplementation();

    const res = resolver.resolve({
      graph: {
        edges: [],
        nodes: {},
        description: {},
      },
      context: mock<PhaseRunnerContext>(),
      phases: [[mock<BaseRule>()]],
    });

    // res.toTgGraph();
  });
});
