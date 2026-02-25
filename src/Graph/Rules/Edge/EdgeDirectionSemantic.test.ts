import { DirectedGraph } from 'graphology';
import { GraphologyAdapter } from '../../Adapters/GraphologyAdapter.js';
import {
  TgEdgeDirectionSemantics,
  TG_SCHEMA_VERSION,
  TgGraph,
  asEdgeId,
  asNodeId,
} from '../../TgGraph.js';
import { EdgeDirectionSemantic } from './EdgeDirectionSemantic.js';

describe('EdgeDirectionSemantic.apply', () => {
  it('shoud set edge direction semantic for matching edges', () => {
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

    const rule = new EdgeDirectionSemantic({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        semantic: TgEdgeDirectionSemantics.Invokes,
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      weight: 1,
      directionSemantic: TgEdgeDirectionSemantics.Invokes,
    });
  });

  it('shoud preserve existing direction semantic by default', () => {
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
            weight: 1,
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

    const rule = new EdgeDirectionSemantic({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        semantic: TgEdgeDirectionSemantics.Invokes,
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      weight: 1,
      directionSemantic: TgEdgeDirectionSemantics.Accesses,
    });
  });

  it('shoud overwrite existing direction semantic when configured', () => {
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
            weight: 1,
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

    const rule = new EdgeDirectionSemantic({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        semantic: TgEdgeDirectionSemantics.Invokes,
        overwrite: true,
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.getEdgeAttributes(edgeId)).toEqual({
      weight: 1,
      directionSemantic: TgEdgeDirectionSemantics.Invokes,
    });
  });

  it('shoud keep inbound matching edges unchanged when enforceDirection is false', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-b-a');

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
          from: nodeB,
          to: nodeA,
          attributes: { weight: 1 },
        },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const rule = new EdgeDirectionSemantic({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        semantic: TgEdgeDirectionSemantics.Invokes,
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.edgeSource(edgeId)).toBe(nodeB);
    expect(result.edgeTarget(edgeId)).toBe(nodeA);
    expect(result.getEdgeAttributes(edgeId)).toEqual({ weight: 1 });
  });

  it('shoud reverse inbound matching edges when enforceDirection is true', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-b-a');

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
          from: nodeB,
          to: nodeA,
          attributes: { weight: 1 },
        },
      ],
    };

    const adapter = new GraphologyAdapter(new DirectedGraph()).withTgGraph(tg);
    const node = adapter.getNodeAttributes(nodeA);
    if (!node) {
      throw new Error('Missing node attributes for node-a');
    }

    const rule = new EdgeDirectionSemantic({
      edge: {
        from: { nodeId: { eq: 'node-a' } },
        to: { nodeId: { eq: 'node-b' } },
      },
      options: {
        semantic: TgEdgeDirectionSemantics.Invokes,
        enforceDirection: true,
      },
    });

    rule.match(nodeA, node, adapter);
    const result = rule.apply(nodeA, node, adapter);

    expect(result.edgeSource(edgeId)).toBe(nodeA);
    expect(result.edgeTarget(edgeId)).toBe(nodeB);
    expect(result.getEdgeAttributes(edgeId)).toEqual({
      weight: 1,
      directionSemantic: TgEdgeDirectionSemantics.Invokes,
    });
  });
});
