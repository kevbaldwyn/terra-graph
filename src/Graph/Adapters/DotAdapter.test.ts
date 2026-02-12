import { DirectedGraph } from 'graphology';
import { DotAdapter } from './DotAdapter.js';
import { asNodeId } from '../TgGraph.js';

describe('DotAdapter', () => {
  it('shoud add and return ranks', () => {
    const adapter = new DotAdapter(new DirectedGraph());
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');

    const updated = adapter.addRank([nodeA, nodeB], 'same');

    expect(updated.getRanks()).toEqual([
      { mode: 'same', nodes: [nodeA, nodeB] },
    ]);
  });

  it('shoud clear ranks', () => {
    const adapter = new DotAdapter(new DirectedGraph());
    const nodeA = asNodeId('node-a');

    const updated = adapter.addRank([nodeA], 'min').clearRanks();

    expect(updated.getRanks()).toEqual([]);
  });
});
