import { DirectedGraph } from 'graphology';
import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { TgGraph, asEdgeId, asNodeId } from '../../TgGraph.js';
import { EdgeDotProperties } from './EdgeDotProperties.js';

describe('EdgeDotProperties.apply', () => {
  it('shoud store dot adapter options for matching edges', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-a-b');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [
        {
          id: edgeId,
          from: nodeA,
          to: nodeB,
          attributes: { weight: 1 },
        },
      ],
    };

    const adapter = new DotAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const hook = new EdgeDotProperties({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        color: 'red',
        style: 'dashed',
      },
    });

    hook.match(nodeA, node, adapter);
    const result = hook.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      weight: 1,
      adapter: {
        [DotAdapter.name]: {
          color: 'red',
          style: 'dashed',
        },
      },
    });
  });

  it('shoud keep graph unchanged when the hook does not match', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-a-b');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [
        {
          id: edgeId,
          from: nodeA,
          to: nodeB,
          attributes: { weight: 1 },
        },
      ],
    };

    const adapter = new DotAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeB);
    if (!node) {
      throw new Error('Missing node attributes for node-b');
    }

    const hook = new EdgeDotProperties({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        color: 'red',
      },
    });

    hook.match(nodeB, node, adapter);
    const result = hook.apply(nodeB, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({ weight: 1 });
  });
});
