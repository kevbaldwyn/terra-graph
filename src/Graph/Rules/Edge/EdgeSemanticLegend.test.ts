import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import {
  TG_SCHEMA_VERSION,
  TgEdgeDirectionSemantics,
  TgGraph,
  asEdgeId,
  asNodeId,
} from '../../TgGraph.js';
import { EdgeSemanticLegend } from './EdgeSemanticLegend.js';

describe('EdgeSemanticLegend.apply', () => {
  it('shoud set legend values for mapped edge semantics', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const nodeC = asNodeId('node-c');
    const invokesEdgeId = asEdgeId('edge-a-b');
    const accessesEdgeId = asEdgeId('edge-a-c');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
      description: {},
      nodes: {
        [nodeA]: { id: nodeA, label: 'A' },
        [nodeB]: { id: nodeB, label: 'B' },
        [nodeC]: { id: nodeC, label: 'C' },
      },
      edges: [
        {
          id: invokesEdgeId,
          from: nodeA,
          to: nodeB,
          attributes: {
            directionSemantic: TgEdgeDirectionSemantics.Invokes,
          },
        },
        {
          id: accessesEdgeId,
          from: nodeA,
          to: nodeC,
          attributes: {
            directionSemantic: TgEdgeDirectionSemantics.Accesses,
          },
        },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const rule = new EdgeSemanticLegend({
      edge: {
        from: { any: true },
        to: { any: true },
      },
      options: {
        legendBySemantic: {
          [TgEdgeDirectionSemantics.Invokes]: {
            title: 'Invokes',
            colour: '#1f77b4',
          },
        },
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(invokesEdgeId)).toEqual({
      directionSemantic: TgEdgeDirectionSemantics.Invokes,
      legend: {
        title: 'Invokes',
        colour: '#1f77b4',
      },
    });
    expect(result.getEdgeAttributes(accessesEdgeId)).toEqual({
      directionSemantic: TgEdgeDirectionSemantics.Accesses,
    });
  });

  it('shoud keep existing legend when overwrite is false', () => {
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
          attributes: {
            directionSemantic: TgEdgeDirectionSemantics.Invokes,
            legend: {
              title: 'Existing',
              colour: '#999999',
            },
          },
        },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const rule = new EdgeSemanticLegend({
      edge: {
        from: { any: true },
        to: { any: true },
      },
      options: {
        legendBySemantic: {
          [TgEdgeDirectionSemantics.Invokes]: {
            title: 'Invokes',
            colour: '#1f77b4',
          },
        },
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      directionSemantic: TgEdgeDirectionSemantics.Invokes,
      legend: {
        title: 'Existing',
        colour: '#999999',
      },
    });
  });

  it('shoud overwrite existing legend when configured', () => {
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
          attributes: {
            directionSemantic: TgEdgeDirectionSemantics.Invokes,
            legend: {
              title: 'Existing',
              colour: '#999999',
            },
          },
        },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const rule = new EdgeSemanticLegend({
      edge: {
        from: { any: true },
        to: { any: true },
      },
      options: {
        legendBySemantic: {
          [TgEdgeDirectionSemantics.Invokes]: {
            title: 'Invokes',
            colour: '#1f77b4',
          },
        },
        overwrite: true,
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      directionSemantic: TgEdgeDirectionSemantics.Invokes,
      legend: {
        title: 'Invokes',
        colour: '#1f77b4',
      },
    });
  });
});
