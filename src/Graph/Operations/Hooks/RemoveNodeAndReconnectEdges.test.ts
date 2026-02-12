import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import { TgGraph, asEdgeId, asNodeId } from '../../TgGraph.js';
import { RemoveNodeAndReconnectEdges } from './RemoveNodeAndReconnectEdges.js';

describe('RemoveNodeAndReconnectEdges.apply', () => {
  it('shoud reconnect predecessors to successors and remove the node', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');
    const nodeD = asNodeId('node-d');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
        [nodeC]: { id: nodeC, label: 'C' },
        [nodeD]: { id: nodeD, label: 'D' },
      },
      edges: [
        { id: asEdgeId('edge-a-b'), from: nodeA, to: nodeB, attributes: {} },
        { id: asEdgeId('edge-c-b'), from: nodeC, to: nodeB, attributes: {} },
        { id: asEdgeId('edge-b-d'), from: nodeB, to: nodeD, attributes: {} },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeB);
    if (!node) {
      throw new Error('Missing node attributes for node-b');
    }

    const hook = new RemoveNodeAndReconnectEdges({
      node: { nodeId: { eq: 'node-b' } },
    });

    hook.match(nodeB, node, adapter);
    const result = hook.apply(nodeB, node, adapter);

    expect(result.getNodeAttributes(nodeB)).toBeUndefined();
    expect(result.edgesBetween(nodeA, nodeD)).toHaveLength(1);
    expect(result.edgesBetween(nodeC, nodeD)).toHaveLength(1);
    for (const edgeId of result.outEdges(nodeA)) {
      expect(result.edgeTarget(edgeId)).not.toBe(nodeB);
    }
    for (const edgeId of result.outEdges(nodeC)) {
      expect(result.edgeTarget(edgeId)).not.toBe(nodeB);
    }
  });

  it('shoud keep graph unchanged when the query does not match', () => {
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
      edges: [
        { id: asEdgeId('edge-a-b'), from: nodeA, to: nodeB, attributes: {} },
        { id: asEdgeId('edge-b-c'), from: nodeB, to: nodeC, attributes: {} },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const hook = new RemoveNodeAndReconnectEdges({
      node: { nodeId: { eq: 'node-b' } },
    });

    hook.match(nodeA, node, adapter);
    const result = hook.apply(nodeA, node, adapter);

    expect(result.getNodeAttributes(nodeB)).toBeDefined();
    expect(result.edgesBetween(nodeA, nodeB)).toHaveLength(1);
    expect(result.edgesBetween(nodeB, nodeC)).toHaveLength(1);
  });
});
