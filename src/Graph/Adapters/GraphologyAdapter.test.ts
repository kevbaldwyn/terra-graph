import { DirectedGraph, UndirectedGraph } from 'graphology';
import { asEdgeId, asNodeId } from '../TgGraph.js';
import { GraphologyAdapter } from './GraphologyAdapter.js';

const buildGraphFixture = () => {
  const graph = new DirectedGraph();
  const a = asNodeId('a');
  const b = asNodeId('b');
  graph.addNode(a, { label: 'A' });
  graph.addNode(b, { label: 'B' });
  const e1 = asEdgeId('e1');
  graph.addEdgeWithKey(e1, a, b, { weight: 2 });
  graph.setAttribute('tg:description', { note: 'test' });
  const tg = {
    nodes: {
      [a]: { id: a, label: 'A' },
      [b]: { id: b, label: 'B' },
    },
    edges: [
      {
        id: e1,
        from: a,
        to: b,
        attributes: { weight: 2 },
      },
    ],
    description: { note: 'test' },
  };
  return { graph, tg, a, b, e1 };
};

describe('Graphology.getGraph()', () => {
  it('shoud return a copy of the original graph without changing it', () => {
    const initialGraph = new UndirectedGraph();
    initialGraph.addNode('a-node', { attribute: 'value' });

    const graphology = new GraphologyAdapter(initialGraph);
    const copiedGraph = graphology.getGraph();

    expect(copiedGraph).not.toBe(initialGraph);
    expect(copiedGraph.export()).toStrictEqual(initialGraph.export());
  });
});

describe('Operations interface', () => {
  describe('Graphology.getNodeAttributes()', () => {
    it('shoud return node attributes when the node exists', () => {
      const { graph, a } = buildGraphFixture();

      const adapter = new GraphologyAdapter(graph);

      expect(adapter.getNodeAttributes(a)).toStrictEqual({
        label: 'A',
      });
    });

    it('shoud return undefined when the node does not exist', () => {
      const { graph, a } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.getNodeAttributes(asNodeId('missing'))).toBeUndefined();
    });
  });

  describe('Graphology.getEdgeAttributes()', () => {
    it('shoud return edge attributes', () => {
      const { graph, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.getEdgeAttributes(e1)).toStrictEqual({ weight: 2 });
    });
  });

  describe('Graphology.edgeSource()', () => {
    it('shoud return the source node id', () => {
      const { graph, a, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.edgeSource(e1)).toBe(a);
    });
  });

  describe('Graphology.edgeTarget()', () => {
    it('shoud return the target node id', () => {
      const { graph, b, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.edgeTarget(e1)).toBe(b);
    });
  });

  describe('Graphology.neighbors()', () => {
    it('shoud return neighboring node ids', () => {
      const { graph, a, b } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.neighbors(a)).toEqual(expect.arrayContaining([b]));
    });
  });

  describe('Graphology.predecessors()', () => {
    it('shoud return predecessor node ids', () => {
      const { graph, a, b } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.predecessors(b)).toEqual(expect.arrayContaining([a]));
    });
  });

  describe('Graphology.successors()', () => {
    it('shoud return successor node ids', () => {
      const { graph, a, b } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.successors(a)).toEqual(expect.arrayContaining([b]));
    });
  });

  describe('Graphology.inEdges()', () => {
    it('shoud return inbound edge ids', () => {
      const { graph, b, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.inEdges(b)).toEqual([e1]);
    });
  });

  describe('Graphology.outEdges()', () => {
    it('shoud return outbound edge ids', () => {
      const { graph, a, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.outEdges(a)).toEqual([e1]);
    });
  });

  describe('Graphology.edgesBetween()', () => {
    it('shoud return edge ids between nodes', () => {
      const { graph, a, b, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.edgesBetween(a, b)).toEqual([e1]);
    });
  });

  describe('Graphology.setNodeAttributes()', () => {
    it('shoud return a new adapter with updated node attributes', () => {
      const { graph, a } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      const updated = adapter.setNodeAttributes(a, { label: 'A2' });

      expect(updated.getNodeAttributes(a)).toStrictEqual({ label: 'A2' });
      expect(adapter.getNodeAttributes(a)).toStrictEqual({ label: 'A' });
    });
  });

  describe('Graphology.setEdge()', () => {
    it('shoud return a new adapter with a new edge', () => {
      const { graph, a, b, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);
      const e2 = asEdgeId('e2');

      const updated = adapter.setEdge(e2, b, a, { weight: 1 });

      expect(updated.edgesBetween(b, a)).toEqual(
        expect.arrayContaining([e1, e2]),
      );
      expect(adapter.edgesBetween(b, a)).toEqual([e1]);
    });
  });

  describe('Graphology.removeNode()', () => {
    it('shoud return a new adapter without the node', () => {
      const { graph, a } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      const updated = adapter.removeNode(a);

      expect(updated.getNodeAttributes(a)).toBeUndefined();
      expect(adapter.getNodeAttributes(a)).toStrictEqual({ label: 'A' });
    });
  });

  describe('Graphology.removeEdge()', () => {
    it('shoud return a new adapter without the edge', () => {
      const { graph, a, b, e1 } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      const updated = adapter.removeEdge(e1);

      expect(updated.edgesBetween(a, b)).toEqual([]);
      expect(adapter.edgesBetween(a, b)).toEqual([e1]);
    });
  });

  describe('Graphology.getLegend()', () => {
    it('shoud return unique legend edge ids', () => {
      const graph = new DirectedGraph();
      const a = asNodeId('a');
      const b = asNodeId('b');
      const c = asNodeId('c');
      graph.addNode(a, { label: 'A' });
      graph.addNode(b, { label: 'B' });
      graph.addNode(c, { label: 'C' });

      const e1 = asEdgeId('e1');
      const e2 = asEdgeId('e2');
      graph.addEdgeWithKey(e1, a, b, { legend: { label: 'route' } });
      graph.addEdgeWithKey(e2, b, c, { legend: { label: 'route' } });

      const adapter = new GraphologyAdapter(graph);

      expect(adapter.getLegend()).toEqual([e1]);
    });

    it('shoud return an empty list when no legend is present', () => {
      const { graph } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.getLegend()).toEqual([]);
    });
  });
});

describe('Adapter interface', () => {
  const buildTgGraph = () => {
    const { a, b, e1 } = buildGraphFixture();
    return {
      tg: {
        nodes: {
          [a]: { id: a, label: 'A' },
          [b]: { id: b, label: 'B' },
        },
        edges: [
          {
            id: e1,
            from: a,
            to: b,
            attributes: { weight: 2 },
          },
        ],
        description: { note: 'test' },
      },
      a,
      b,
      e1,
    };
  };

  describe('Graphology.fromTgGraph()', () => {
    it('shoud return a new adapter with the graph data applied', () => {
      const { tg } = buildTgGraph();

      const updated = GraphologyAdapter.fromTgGraph(tg);

      expect(updated.toTgGraph()).toStrictEqual(tg);
    });

    it('shoud default missing edge attributes to an empty object', () => {
      const { a, b, e1 } = buildGraphFixture();
      const tg = {
        nodes: {
          [a]: { id: a, label: 'A' },
          [b]: { id: b, label: 'B' },
        },
        edges: [
          {
            id: e1,
            from: a,
            to: b,
          },
        ],
        description: {},
      };

      const updated = GraphologyAdapter.fromTgGraph(tg);

      expect(updated.toTgGraph()).toStrictEqual({
        ...tg,
        edges: [
          {
            ...tg.edges[0],
            attributes: {},
          },
        ],
      });
    });
  });

  describe('Graphology.toTgGraph()', () => {
    it('shoud return a TgGraph representation of the current graph', () => {
      const { tg, graph } = buildGraphFixture();
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.toTgGraph()).toStrictEqual(tg);
    });

    it('shoud use fallback values when graph attributes are missing', () => {
      const graph = new DirectedGraph();
      const a = asNodeId('a');
      graph.addNode(a, { label: 'A' });
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.toTgGraph()).toStrictEqual({
        nodes: {
          [a]: { id: a, label: 'A' },
        },
        edges: [],
        description: {},
      });
    });

    it('shoud include meta and parent when present on the node attributes', () => {
      const graph = new DirectedGraph();
      const a = asNodeId('a');
      const parentId = asNodeId('parent');
      graph.addNode(a, {
        label: 'A',
        meta: { resource: 'some_resouce', name: 'some_name' },
        parent: { id: parentId, isModule: true },
      });
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.toTgGraph()).toStrictEqual({
        nodes: {
          [a]: {
            id: a,
            label: 'A',
            meta: { resource: 'some_resouce', name: 'some_name' },
            parent: { id: parentId, isModule: true },
          },
        },
        edges: [],
        description: {},
      });
    });

    it('shoud fall back to the node id when the label is missing', () => {
      const graph = new DirectedGraph();
      const a = asNodeId('a');
      graph.addNode(a, {});
      const adapter = new GraphologyAdapter(graph);

      expect(adapter.toTgGraph()).toStrictEqual({
        nodes: {
          [a]: { id: a, label: 'a' },
        },
        edges: [],
        description: {},
      });
    });
  });
});
