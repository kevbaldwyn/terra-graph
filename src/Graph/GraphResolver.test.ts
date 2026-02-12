import { mock } from 'jest-mock-extended';
import { GraphResolver, HookRunnerContext } from './GraphResolver.js';
import { Hook } from './Hooks/Hooks.js';
import { BaseHook } from './Operations/NodeHook.js';
import { AdapterOperations } from './Operations/Operations.js';

describe('GraphResolver.resolve', () => {
  it('shoud resolve without hooks when there are no nodes', () => {
    const adapter = mock<AdapterOperations>();
    adapter.nodeIds.mockReturnValue([]);
    // const adapter = new GraphologyAdapter(new Graph.DirectedGraph());

    const resolver = new GraphResolver({
      fromTgGraph() {
        return adapter;
      },
    });

    // const hook = mock<NodeHook>();
    // hook.apply.mockImplementation((_nodeId, _node, graph) => graph);
    // hook.match.mockImplementation();

    const res = resolver.resolve({
      graph: {
        edges: [],
        nodes: {},
        description: {},
      },
      context: mock<HookRunnerContext>(),
      hooks: {
        [Hook.META_BEFORE]: [
          mock<BaseHook>(),
          // new (class extends NodeHook {
          //   public override match(nodeId: NodeId, node, graph) {
          //     // node.label;
          //     return graph.inEdges(nodeId).length > 0;
          //   }

          //   public override apply(_nodeId, _node, graph) {
          //     return graph;
          //   }

          //   public override serialize() {
          //     return { id: 'test-hook' };
          //   }
          // })(),
        ],
      },
    });

    // res.toTgGraph();
  });
});
