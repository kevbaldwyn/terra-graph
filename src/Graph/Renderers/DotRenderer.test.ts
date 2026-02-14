import { DirectedGraph } from 'graphology';
import { DotAdapter } from '../Adapters/DotAdapter.js';
import { DotRenderer } from './DotRenderer.js';
import { asEdgeId, asNodeId, TgGraph } from '../TgGraph.js';

describe('DotRenderer.render', () => {
  it('shoud render nodes and edges with dot adapter attributes', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-a-b');

    const tg: TgGraph = {
      description: {},
      nodes: {
        [nodeA]: {
          id: nodeA,
          label: 'A',
          adapter: {
            [DotAdapter.name]: { shape: 'box' },
          },
        },
        [nodeB]: { id: nodeB, label: 'B' },
      },
      edges: [
        {
          id: edgeId,
          from: nodeA,
          to: nodeB,
          attributes: {
            adapter: {
              [DotAdapter.name]: { style: 'dashed' },
            },
          },
        },
      ],
    };

    const adapter = new DotAdapter(new DirectedGraph()).withTgGraph(tg);
    const renderer = new DotRenderer();

    const output = renderer.render(adapter);

    expect(output).toContain('"node-a"');
    expect(output).toContain('label=A');
    expect(output).toContain('shape=box');
    expect(output).toContain('style=dashed');
  });

  it('shoud include ranks when provided', () => {
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

    const adapter = new DotAdapter(new DirectedGraph()).withTgGraph(tg);
    const ranked = adapter.addRank([nodeA, nodeB], 'same');
    const renderer = new DotRenderer();

    const output = renderer.render(ranked);

    expect(output).toContain(`{ rank = same; "${nodeA}" "${nodeB}" }`);
  });
});
