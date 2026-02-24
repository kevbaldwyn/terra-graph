import { mock } from 'jest-mock-extended';
import { GraphResolver, PhaseRunnerContext } from './GraphResolver.js';
import { AdapterOperations } from './Operations/Operations.js';
import { BaseRule } from './Rules/Rule.js';
import { TG_SCHEMA_VERSION } from './TgGraph.js';

describe('GraphResolver.resolve', () => {
  it('shoud resolve without phases when there are no nodes', () => {
    const adapter = mock<AdapterOperations>();
    adapter.withTgGraph.mockReturnValue(adapter);
    adapter.nodeIds.mockReturnValue([]);
    // const adapter = new GraphologyAdapter(new Graph.DirectedGraph());

    const resolver = new GraphResolver(adapter, mock<PhaseRunnerContext>());

    // const rule = mock<NodeRule>();
    // rule.apply.mockImplementation((_nodeId, _node, graph) => graph);
    // rule.match.mockImplementation();

    const res = resolver.resolve({
      graph: {
        schemaVersion: TG_SCHEMA_VERSION,
        edges: [],
        nodes: {},
        description: {},
      },
      phases: [[mock<BaseRule>()]],
    });

    // res.toTgGraph();
  });
});
