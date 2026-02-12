import { DirectedGraph } from 'graphology';
import { DotAdapter } from '../../Adapters/DotAdapter.js';
import { asEdgeId, asNodeId, TgGraph } from '../../TgGraph.js';
import { AlignNodes } from './AlignNodes.js';

describe('AlignNodes', () => {
  it('shoud add a rank and edge attributes for matching nodes', () => {
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
        {
          id: asEdgeId('edge-1'),
          from: nodeA,
          to: nodeB,
          attributes: {},
        },
        {
          id: asEdgeId('edge-2'),
          from: nodeB,
          to: nodeC,
          attributes: {
            some: 'value',
          },
        },
      ],
    };
    const matcher = {
      edge: {
        from: { nodeId: { eq: 'node-b' } },
        to: { nodeId: { eq: 'node-c' } },
      },
    };

    const adapter = new DotAdapter(new DirectedGraph()).fromTgGraph(tg);
    const moduleNode = adapter.getNodeAttributes(nodeB);
    if (!moduleNode) {
      throw new Error('Missing node attributes for node-b');
    }

    // const hook = new AlignNodes(matcher, { legend: { label: 'rank' } });
    const hook = new AlignNodes(matcher);
    hook.match(nodeB, moduleNode, adapter);
    const result = hook.apply(nodeB, moduleNode, adapter) as DotAdapter;

    expect(result.getRanks()).toEqual([
      { mode: 'same', nodes: [nodeB, nodeC] },
    ]);
    expect(result.getEdgeAttributes(asEdgeId('edge-1'))).toEqual({});
    expect(result.getEdgeAttributes(asEdgeId('edge-2'))).toEqual({
      some: 'value',
    });
  });

  it('shoud keep graph unchanged when the hook does not match', () => {
    const nodeId = asNodeId('node-a');
    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeId]: { id: nodeId, label: 'A' },
      },
      edges: [],
    };

    const adapter = new DotAdapter(new DirectedGraph()).fromTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeId);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const hook = new AlignNodes({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
    });

    hook.match(nodeId, node, adapter);
    const result = hook.apply(nodeId, node, adapter) as DotAdapter;

    expect(result.getRanks()).toEqual([]);
  });
});
