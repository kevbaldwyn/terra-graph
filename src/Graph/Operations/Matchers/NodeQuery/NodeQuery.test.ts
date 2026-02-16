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
});
