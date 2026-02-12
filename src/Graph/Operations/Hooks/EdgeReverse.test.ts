import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import { asEdgeId, asNodeId, TgGraph } from '../../TgGraph.js';
import { EdgeReverse } from './EdgeReverse.js';

describe('EdgeReverse', () => {
  it('shoud reverse matching inbound edges', () => {
    const hook = new EdgeReverse({
      edge: {
        from: { nodeId: { eq: 'node-b' } },
        to: { nodeId: { eq: 'node-a' } },
      },
    });

    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');
    const edgeId = asEdgeId('edge-1');
    const otherEdgeId = asEdgeId('edge-2');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
        [nodeC]: { id: nodeC, label: 'C' },
      },
      edges: [
        { id: edgeId, from: nodeA, to: nodeB, attributes: {} },
        { id: otherEdgeId, from: nodeC, to: nodeB, attributes: {} },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeB);
    if (!node) {
      throw new Error('Missing node attributes for node-b');
    }

    hook.match(nodeB, node, adapter);
    const result = hook.apply(nodeB, node, adapter);

    expect(result.edgeSource(edgeId)).toBe(nodeB);
    expect(result.edgeTarget(edgeId)).toBe(nodeA);
    expect(result.edgeSource(otherEdgeId)).toBe(nodeC);
    expect(result.edgeTarget(otherEdgeId)).toBe(nodeB);
    expect(result.getEdgeAttributes(edgeId)).toEqual({});
  });

  it('shoud keep graph unchanged when the hook does not match', () => {
    const hook = new EdgeReverse({
      edge: {
        from: { nodeId: { eq: 'node-b' } },
        to: { nodeId: { eq: 'node-a' } },
      },
    });

    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-1');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [{ id: edgeId, from: nodeA, to: nodeB, attributes: {} }],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    hook.match(nodeA, node, adapter);
    const result = hook.apply(nodeA, node, adapter);

    expect(result.edgeSource(edgeId)).toBe(nodeA);
    expect(result.edgeTarget(edgeId)).toBe(nodeB);
  });
});
