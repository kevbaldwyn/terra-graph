import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import { TgGraph, asEdgeId, asNodeId } from '../../TgGraph.js';
import { RemoveEdge } from './RemoveEdge.js';

describe('RemoveEdge.apply', () => {
  it('shoud remove matching outbound edges', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');
    const edgeAB = asEdgeId('edge-ab');
    const edgeAC = asEdgeId('edge-ac');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
        [nodeC]: { id: nodeC, label: 'C' },
      },
      edges: [
        { id: edgeAB, from: nodeA, to: nodeB, attributes: {} },
        { id: edgeAC, from: nodeA, to: nodeC, attributes: {} },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const hook = new RemoveEdge({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
    });

    hook.match(nodeA, node, adapter);
    const result = hook.apply(nodeA, node, adapter);

    expect(result.edgesBetween(nodeA, nodeB)).toEqual([]);
    expect(result.edgesBetween(nodeA, nodeC)).toEqual([edgeAC]);
  });

  it('shoud keep graph unchanged when the hook does not match', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeAB = asEdgeId('edge-ab');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [{ id: edgeAB, from: nodeA, to: nodeB, attributes: {} }],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeB);
    if (!node) {
      throw new Error('Missing node attributes for node-b');
    }

    const hook = new RemoveEdge({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
    });

    hook.match(nodeB, node, adapter);
    const result = hook.apply(nodeB, node, adapter);

    expect(result.edgesBetween(nodeA, nodeB)).toEqual([edgeAB]);
  });
});
