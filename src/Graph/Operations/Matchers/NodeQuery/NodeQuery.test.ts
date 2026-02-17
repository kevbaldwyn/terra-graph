import { mock } from 'jest-mock-extended';
import { Operations } from '../../Operations.js';
import { TgNodeAttributes, asNodeId } from '../../../TgGraph.js';
import { NodeQuery } from './NodeQuery.js';

describe('NodeQuery.match', () => {
  it('shoud return true for any node when using any', () => {
    const query = NodeQuery.from({ any: true });
    const graph = mock<Operations>();
    const nodeId = asNodeId('node-a');
    const node: TgNodeAttributes = { label: 'resource.name' };

    expect(query.match(nodeId, node, graph)).toBe(true);
  });

  it('shoud support children.exists with false', () => {
    const parentId = asNodeId('cluster_module.a');

    const query = NodeQuery.from({
      and: [{ nodeId: { startsWith: 'cluster_module' } }, { children: { exists: false } }],
    });
    const graph = mock<Operations>();

    graph.successors.mockReturnValue([asNodeId('module.a.resource.one')]);

    const resultWithChild = query.match(parentId, { label: 'module.a' }, graph);
    expect(resultWithChild).toBe(false);

    graph.successors.mockReturnValue([]);
    const resultWithoutChild = query.match(parentId, { label: 'module.a' }, graph);
    expect(resultWithoutChild).toBe(true);
  });

  it('shoud support children.count', () => {
    const parentId = asNodeId('cluster_module.a');

    const query = NodeQuery.from({
      and: [{ nodeId: { startsWith: 'cluster_module' } }, { children: { count: 2 } }],
    });
    const graph = mock<Operations>();

    graph.successors.mockReturnValue([
      asNodeId('module.a.resource.one'),
      asNodeId('module.a.resource.two'),
    ]);

    expect(query.match(parentId, { label: 'module.a' }, graph)).toBe(true);
  });

  it('shoud evaluate children independently of module naming conventions', () => {
    const sourceId = asNodeId('alpha');

    const query = NodeQuery.from({ children: { exists: true } });
    const graph = mock<Operations>();

    graph.successors.mockReturnValue([asNodeId('beta')]);

    expect(query.match(sourceId, { label: 'random.node' }, graph)).toBe(true);
  });
});
