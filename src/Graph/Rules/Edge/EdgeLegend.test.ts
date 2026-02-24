import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import {
  TG_SCHEMA_VERSION,
  TgGraph,
  asEdgeId,
  asNodeId,
} from '../../TgGraph.js';
import { EdgeLegend } from './EdgeLegend.js';

describe('EdgeLegend.apply', () => {
  it('shoud set legend attributes for matching edges', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-a-b');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
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

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const rule = new EdgeLegend({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        title: 'Dead Letter Queue',
        colour: '#c20202',
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      weight: 1,
      legend: {
        title: 'Dead Letter Queue',
        colour: '#c20202',
      },
    });
  });

  it('shoud keep graph unchanged when the rule does not match', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-a-b');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
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

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeB);
    if (!node) {
      throw new Error('Missing node attributes for node-b');
    }

    const rule = new EdgeLegend({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        title: 'Dead Letter Queue',
        colour: '#c20202',
      },
    });

    rule.match(nodeB, node, adapter);
    const result = rule.apply(nodeB, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({ weight: 1 });
  });
});

