import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import { asNodeId, edgeIdFrom, TgGraph } from '../../TgGraph.js';
import { ExplicitEdge } from './ExplicitEdge.js';

describe('ExplicitEdge', () => {
  it('shoud add edges from matching source nodes to matching target nodes', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
        [nodeC]: { id: nodeC, label: 'C' },
      },
      edges: [],
    };

    const hook = new ExplicitEdge({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { in: ['node-b', 'node-c'] } },
      },
    });

    const adapter = new GraphologyAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    hook.match(nodeA, node, adapter);
    const result = hook.apply(nodeA, node, adapter);

    const edgeAB = edgeIdFrom(nodeA, nodeB);
    const edgeAC = edgeIdFrom(nodeA, nodeC);

    expect(result.edgeSource(edgeAB)).toBe(nodeA);
    expect(result.edgeTarget(edgeAB)).toBe(nodeB);
    expect(result.edgeSource(edgeAC)).toBe(nodeA);
    expect(result.edgeTarget(edgeAC)).toBe(nodeC);
    expect(result.getEdgeAttributes(edgeAB)).toEqual({});
  });

  it('shoud keep graph unchanged when the hook does not match', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [],
    };

    const hook = new ExplicitEdge({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
    });

    const adapter = new GraphologyAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeB);
    if (!node) {
      throw new Error('Missing node attributes for node-b');
    }

    hook.match(nodeB, node, adapter);
    const result = hook.apply(nodeB, node, adapter);

    expect(result.outEdges(nodeA)).toEqual([]);
  });
});
