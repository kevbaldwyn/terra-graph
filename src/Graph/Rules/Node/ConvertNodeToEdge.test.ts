import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import { TgGraph, asEdgeId, asNodeId, edgeIdFrom } from '../../TgGraph.js';
import { ConvertNodeToEdge } from './ConvertNodeToEdge.js';

describe('ConvertNodeToEdge.apply', () => {
  it('shoud convert a node with a single in/out edge into a labeled edge', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeLabel = asNodeId('resource.name');
    const edgeIn = asEdgeId('edge-in');
    const edgeOut = asEdgeId('edge-out');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeLabel]: {
          id: nodeLabel,
          label: 'resource.name',
          meta: { resource: 'resource', name: 'name' },
        },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [
        { id: edgeIn, from: nodeA, to: nodeLabel, attributes: {} },
        { id: edgeOut, from: nodeLabel, to: nodeB, attributes: {} },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeLabel);
    if (!node) {
      throw new Error('Missing node attributes for resource.name');
    }

    const hook = new ConvertNodeToEdge({
      node: { attr: { key: 'label', eq: 'resource.name' } },
    });

    hook.match(nodeLabel, node, adapter);
    const result = hook.apply(nodeLabel, node, adapter);

    const edgeId = edgeIdFrom(nodeA, nodeB);
    expect(result.getEdgeAttributes(edgeId)).toEqual({
      renderHints: { resource: 'resource', name: 'name' },
    });
    expect(result.edgeSource(edgeId)).toBe(nodeA);
    expect(result.edgeTarget(edgeId)).toBe(nodeB);
    expect(result.nodeIds()).not.toContain(nodeLabel);
  });

  it('shoud keep graph unchanged when the node does not have a single in/out edge', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');
    const nodeLabel = asNodeId('resource.name');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeLabel]: { id: nodeLabel, label: 'resource.name' },
        [nodeB]: { id: nodeB, label: 'B' },
        [nodeC]: { id: nodeC, label: 'C' },
      },
      edges: [
        { id: asEdgeId('edge-in'), from: nodeA, to: nodeLabel },
        { id: asEdgeId('edge-out-1'), from: nodeLabel, to: nodeB },
        { id: asEdgeId('edge-out-2'), from: nodeLabel, to: nodeC },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeLabel);
    if (!node) {
      throw new Error('Missing node attributes for resource.name');
    }

    const hook = new ConvertNodeToEdge({
      node: { attr: { key: 'label', eq: 'resource.name' } },
    });

    hook.match(nodeLabel, node, adapter);
    const result = hook.apply(nodeLabel, node, adapter);

    expect(result).toBe(adapter);
  });
});
