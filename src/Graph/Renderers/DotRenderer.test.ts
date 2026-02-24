import { DirectedGraph } from 'graphology';
import { DotAdapter } from '../Adapters/DotAdapter.js';
import { TG_SCHEMA_VERSION, TgGraph, asEdgeId, asNodeId } from '../TgGraph.js';
import { DotRenderer } from './DotRenderer.js';

describe('DotRenderer.render', () => {
  it('shoud render nodes and edges with dot adapter attributes', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');
    const edgeId = asEdgeId('edge-a-b');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
      description: {},
      nodes: {
        [nodeA]: {
          id: nodeA,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.a',
            resource: 'aws_s3_bucket',
            name: 'a',
          },
          adapter: {
            [DotAdapter.name]: { shape: 'box' },
          },
        },
        [nodeB]: {
          id: nodeB,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.b',
            resource: 'aws_s3_bucket',
            name: 'b',
          },
        },
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
    expect(output).toContain('label="aws_s3_bucket.a"');
    expect(output).toContain('shape=box');
    expect(output).toContain('style=dashed');
  });

  it('shoud include ranks when provided', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
      description: {},
      nodes: {
        [nodeA]: {
          id: nodeA,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.a',
            resource: 'aws_s3_bucket',
            name: 'a',
          },
        },
        [nodeB]: {
          id: nodeB,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.b',
            resource: 'aws_s3_bucket',
            name: 'b',
          },
        },
      },
      edges: [],
    };

    const adapter = new DotAdapter(new DirectedGraph()).withTgGraph(tg);
    const ranked = adapter.addRank([nodeA, nodeB], 'same');
    const renderer = new DotRenderer();

    const output = renderer.render(ranked);

    expect(output).toContain(`{ rank = same; "${nodeA}" "${nodeB}" }`);
  });

  it('shoud include graph attributes such as rankdir when provided', () => {
    const nodeA = asNodeId('node-a');
    const nodeB = asNodeId('node-b');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
      description: {},
      nodes: {
        [nodeA]: {
          id: nodeA,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.a',
            resource: 'aws_s3_bucket',
            name: 'a',
          },
        },
        [nodeB]: {
          id: nodeB,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.b',
            resource: 'aws_s3_bucket',
            name: 'b',
          },
        },
      },
      edges: [],
    };

    const adapter = new DotAdapter(new DirectedGraph()).withTgGraph(tg);
    const renderer = new DotRenderer({
      graph: { rankdir: 'LR' },
    });

    const output = renderer.render(adapter);

    expect(output).toContain('rankdir=LR');
  });

  it('shoud set nodesep and ranksep defaults for TB rankdir when not provided', () => {
    const nodeA = asNodeId('node-a');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
      description: {},
      nodes: {
        [nodeA]: {
          id: nodeA,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.a',
            resource: 'aws_s3_bucket',
            name: 'a',
          },
        },
      },
      edges: [],
    };

    const adapter = new DotAdapter(new DirectedGraph()).withTgGraph(tg);
    const renderer = new DotRenderer({
      graph: { rankdir: 'TB' },
    });

    const output = renderer.render(adapter);

    expect(output).toContain('rankdir=TB');
    expect(output).toContain('nodesep=2.5');
    expect(output).toContain('ranksep=0.6');
  });

  it('shoud keep explicit nodesep and ranksep when provided with TB rankdir', () => {
    const nodeA = asNodeId('node-a');

    const tg: TgGraph = {
      schemaVersion: TG_SCHEMA_VERSION,
      description: {},
      nodes: {
        [nodeA]: {
          id: nodeA,
          terraform: {
            kind: 'resource',
            address: 'aws_s3_bucket.a',
            resource: 'aws_s3_bucket',
            name: 'a',
          },
        },
      },
      edges: [],
    };

    const adapter = new DotAdapter(new DirectedGraph()).withTgGraph(tg);
    const renderer = new DotRenderer({
      graph: {
        rankdir: 'TB',
        nodesep: 9.9,
        ranksep: 8.8,
      },
    });

    const output = renderer.render(adapter);

    expect(output).toContain('rankdir=TB');
    expect(output).toContain('nodesep=9.9');
    expect(output).toContain('ranksep=8.8');
  });
});
